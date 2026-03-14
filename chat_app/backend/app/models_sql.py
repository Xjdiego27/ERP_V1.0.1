from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .sql_db import Base
import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=True)
    hashed_password = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    avatar = Column(String(500), nullable=True)  # URL de foto
    status = Column(String(256), nullable=True)  # Estado/bio
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    friends = relationship('Friend', back_populates='user', foreign_keys='Friend.user_id')
    posts = relationship('Post', back_populates='author')

class Friend(Base):
    __tablename__ = 'friends'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    friend_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship('User', foreign_keys=[user_id])
    friend = relationship('User', foreign_keys=[friend_id])

    __table_args__ = (UniqueConstraint('user_id', 'friend_id', name='uq_user_friend'),)

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(String(2000), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    author = relationship('User', back_populates='posts')

