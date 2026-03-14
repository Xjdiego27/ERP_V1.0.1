import datetime
from typing import Optional

# Try to use Beanie Document when available and compatible. If beanie/motor/pymongo
# are not installed or incompatible (common in local dev), provide a lightweight
# fallback Message class with the minimal interface the app expects.
try:
    from beanie import Document, Indexed
    from pydantic import Field

    class Message(Document):
        sender_id: int
        receiver_id: int
        content: str
        content_type: str = "text"  # text, emoji, media, buzz
        media_url: Optional[str] = None
        created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

        class Settings:
            name = "messages"
            indexes = [Indexed("created_at"), (("sender_id", "receiver_id", "created_at"), {})]

except Exception:
    # Fallback lightweight model for environments without beanie/motor/pymongo
    class Message:
        def __init__(self, **kwargs):
            self.sender_id = kwargs.get('sender_id')
            self.receiver_id = kwargs.get('receiver_id')
            self.content = kwargs.get('content', '')
            self.content_type = kwargs.get('content_type', 'text')
            self.media_url = kwargs.get('media_url')
            self.created_at = kwargs.get('created_at', datetime.datetime.utcnow())

        async def insert(self):
            # no-op fallback for local/dev
            return self

        def dict(self):
            return {
                'sender_id': self.sender_id,
                'receiver_id': self.receiver_id,
                'content': self.content,
                'content_type': self.content_type,
                'media_url': self.media_url,
                'created_at': self.created_at.isoformat(),
            }
