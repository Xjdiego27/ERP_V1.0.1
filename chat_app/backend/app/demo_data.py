from .models_sql import User, Friend, Post
from .sql_db import AsyncSessionLocal
from .auth import get_password_hash
from sqlalchemy import text
import asyncio

async def create_demo_users():
    """Create demo users for development"""
    async with AsyncSessionLocal() as session:
        # Check if demo users exist
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            
            if count > 0:
                return  # Demo users already exist
        except:
            pass
        
        demo_users = [
            {
                "username": "alice",
                "email": "alice@example.com",
                "full_name": "Alice Johnson",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
                "status": "Feeling happy! 😊"
            },
            {
                "username": "bob",
                "email": "bob@example.com",
                "full_name": "Bob Smith",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Bob+Smith&background=random",
                "status": "Working on new projects"
            },
            {
                "username": "charlie",
                "email": "charlie@example.com",
                "full_name": "Charlie Brown",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Charlie+Brown&background=random",
                "status": "Life is good! 🎉"
            },
            {
                "username": "diana",
                "email": "diana@example.com",
                "full_name": "Diana Prince",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Diana+Prince&background=random",
                "status": "Always learning"
            },
            {
                "username": "eve",
                "email": "eve@example.com",
                "full_name": "Eve Wilson",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Eve+Wilson&background=random",
                "status": "Love coding ❤️"
            },
            {
                "username": "frank",
                "email": "frank@example.com",
                "full_name": "Frank Miller",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Frank+Miller&background=random",
                "status": "Coffee addict ☕"
            },
            {
                "username": "grace",
                "email": "grace@example.com",
                "full_name": "Grace Lee",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Grace+Lee&background=random",
                "status": "Traveling the world"
            },
            {
                "username": "henry",
                "email": "henry@example.com",
                "full_name": "Henry Davis",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Henry+Davis&background=random",
                "status": "Enjoying life 🌟"
            },
            {
                "username": "iris",
                "email": "iris@example.com",
                "full_name": "Iris Martinez",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Iris+Martinez&background=random",
                "status": "Creative mind"
            },
            {
                "username": "jack",
                "email": "jack@example.com",
                "full_name": "Jack Anderson",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Jack+Anderson&background=random",
                "status": "Let's connect!"
            },
            {
                "username": "kate",
                "email": "kate@example.com",
                "full_name": "Kate Taylor",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Kate+Taylor&background=random",
                "status": "Digital creator"
            },
            {
                "username": "liam",
                "email": "liam@example.com",
                "full_name": "Liam Thomas",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Liam+Thomas&background=random",
                "status": "Tech enthusiast"
            },
            {
                "username": "maya",
                "email": "maya@example.com",
                "full_name": "Maya Garcia",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Maya+Garcia&background=random",
                "status": "Design lover 🎨"
            },
            {
                "username": "noah",
                "email": "noah@example.com",
                "full_name": "Noah White",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Noah+White&background=random",
                "status": "Always coding"
            },
            {
                "username": "olivia",
                "email": "olivia@example.com",
                "full_name": "Olivia Harris",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Olivia+Harris&background=random",
                "status": "Living my best life"
            },
            {
                "username": "peter",
                "email": "peter@example.com",
                "full_name": "Peter Clark",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Peter+Clark&background=random",
                "status": "Software engineer"
            },
            {
                "username": "quinn",
                "email": "quinn@example.com",
                "full_name": "Quinn Rodriguez",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Quinn+Rodriguez&background=random",
                "status": "Passionate coder"
            },
            {
                "username": "rachel",
                "email": "rachel@example.com",
                "full_name": "Rachel Lewis",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Rachel+Lewis&background=random",
                "status": "Always smiling 😊"
            },
            {
                "username": "steve",
                "email": "steve@example.com",
                "full_name": "Steve Walker",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Steve+Walker&background=random",
                "status": "App developer"
            },
            {
                "username": "tina",
                "email": "tina@example.com",
                "full_name": "Tina Evans",
                "password": "password123",
                "avatar": "https://ui-avatars.com/api/?name=Tina+Evans&background=random",
                "status": "Full stack dev"
            },
        ]
        
        users = []
        for user_data in demo_users:
            password = user_data.pop("password")
            user = User(
                **user_data,
                hashed_password=get_password_hash(password)
            )
            session.add(user)
            users.append(user)
        
        await session.flush()  # Get IDs without committing
        
        # Create friendships (make everyone friends with everyone)
        for i, user in enumerate(users):
            for friend in users:
                if user.id != friend.id:
                    try:
                        friendship = Friend(user_id=user.id, friend_id=friend.id)
                        session.add(friendship)
                    except:
                        pass  # Skip duplicate friendships
        
        # Create some demo posts
        demo_posts = [
            {"author_id": 1, "content": "Just finished an amazing project! 🚀"},
            {"author_id": 2, "content": "Coffee and coding... the best combo"},
            {"author_id": 3, "content": "Check out this cool feature I built!"},
            {"author_id": 1, "content": "Anyone up for a chat? 💬"},
            {"author_id": 4, "content": "Learning something new every day!"},
        ]
        
        for post_data in demo_posts:
            post = Post(**post_data)
            session.add(post)
        
        await session.commit()
        print("✅ Demo users, friendships and posts created!")

async def init_demo_data():
    """Initialize demo data if needed"""
    try:
        await create_demo_users()
    except Exception as e:
        print(f"Note: Could not create demo users: {e}")

