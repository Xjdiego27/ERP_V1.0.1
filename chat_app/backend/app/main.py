from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import socketio
from .sockets import sio
from .models_sql import User, Friend, Post
from .sql_db import AsyncSessionLocal, init_db
from .auth import create_access_token, verify_token, verify_password, get_password_hash, Token
from .demo_data import init_demo_data
from pydantic import BaseModel
from sqlalchemy import select, or_
from typing import Optional, List

app = FastAPI(title="Chat App")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
app.mount("/ws", socketio.ASGIApp(sio))

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    avatar: Optional[str]
    status: Optional[str]
    
    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    content: str
    author: UserResponse
    created_at: str
    
    class Config:
        from_attributes = True

# Dependency for getting current user
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == token_data.user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(
            select(User).where(
                or_(User.username == user_data.username, User.email == user_data.email)
            )
        )
        if result.scalar():
            raise HTTPException(status_code=400, detail="User already exists")
        
        user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            avatar=f"https://ui-avatars.com/api/?name={user_data.full_name or user_data.username}&background=random"
        )
        session.add(user)
        await session.flush()
        user_id = user.id
        await session.commit()
        
        token = create_access_token(user_id, user_data.username)
        return {"access_token": token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.username == user_data.username)
        )
        user = result.scalar()
        
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        token = create_access_token(user.id, user.username)
        return {"access_token": token, "token_type": "bearer"}

@app.get("/api/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.from_orm(current_user)

@app.get("/api/contacts", response_model=List[UserResponse])
async def get_contacts(current_user: User = Depends(get_current_user)):
    """Get user's friends/contacts"""
    async with AsyncSessionLocal() as session:
        try:
            # Get friends from Friend table
            result = await session.execute(
                select(Friend.friend_id).where(Friend.user_id == current_user.id)
            )
            friend_ids = [row[0] for row in result.all()]
            
            if friend_ids:
                # Get user details for each friend
                result = await session.execute(
                    select(User).where(User.id.in_(friend_ids)).order_by(User.full_name)
                )
                friends = result.scalars().all()
                return [UserResponse.from_orm(f) for f in friends]
            else:
                return []
        except Exception as e:
            print(f"Error fetching contacts: {e}")
            # Fallback: return all users except current user, ordered by name
            result = await session.execute(
                select(User).where(User.id != current_user.id).order_by(User.full_name)
            )
            users = result.scalars().all()
            return [UserResponse.from_orm(u) for u in users]

@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users except current user"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id != current_user.id)
        )
        users = result.scalars().all()
        return [UserResponse.from_orm(u) for u in users]

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: User = Depends(get_current_user)):
    """Get a specific user's profile"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.from_orm(user)

@app.get("/api/feed")
async def get_feed(current_user: User = Depends(get_current_user)):
    """Get feed of posts from friends"""
    async with AsyncSessionLocal() as session:
        # Get all friends' IDs
        result = await session.execute(
            select(Friend.friend_id).where(Friend.user_id == current_user.id)
        )
        friend_ids = [row[0] for row in result.all()]
        
        # Get posts from friends
        result = await session.execute(
            select(Post)
            .where(Post.author_id.in_(friend_ids + [current_user.id]))
            .order_by(Post.created_at.desc())
            .limit(20)
        )
        posts = result.scalars().all()
        
        posts_data = []
        for post in posts:
            posts_data.append({
                "id": post.id,
                "content": post.content,
                "created_at": post.created_at.isoformat(),
                "author": UserResponse.from_orm(post.author)
            })
        
        return posts_data

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    try:
        await init_db()
        await init_demo_data()
    except Exception as e:
        print(f"Warning: {e}")


