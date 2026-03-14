import asyncio
import datetime
from typing import Dict, Set
from .models_mongo import Message

class MessageProcessor:
    allowed_types = {"text", "emoji", "media", "buzz"}

    @classmethod
    async def validate(cls, payload: dict) -> bool:
        if payload.get("content_type") not in cls.allowed_types:
            return False
        # add media validations
        return True

class ChatManager:
    """Manage active connections and route messages"""
    def __init__(self):
        # user_id -> set of socket session ids
        self.active: Dict[int, Set[str]] = {}

    def add(self, user_id: int, sid: str):
        self.active.setdefault(user_id, set()).add(sid)

    def remove(self, user_id: int, sid: str):
        s = self.active.get(user_id)
        if s and sid in s:
            s.remove(sid)
            if not s:
                del self.active[user_id]

    def get_sids(self, user_id: int):
        return list(self.active.get(user_id, []))

chat_manager = ChatManager()

# Simple in-memory cooldown store for buzz (user_id -> timestamp of last buzz)
buzz_cooldowns: Dict[int, datetime.datetime] = {}

def can_buzz(user_id: int, cooldown_seconds: int = 10) -> bool:
    now = datetime.datetime.utcnow()
    last = buzz_cooldowns.get(user_id)
    if last and (now - last).total_seconds() < cooldown_seconds:
        return False
    buzz_cooldowns[user_id] = now
    return True
