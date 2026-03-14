import socketio
from fastapi import BackgroundTasks
from .chat import chat_manager, MessageProcessor, can_buzz
from .models_mongo import Message
from .auth import verify_token
import asyncio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ):
    # Get token from query params: ?token=JWT_TOKEN
    qs = environ.get('QUERY_STRING', '')
    token = None
    for part in qs.split('&'):
        if part.startswith('token='):
            token = part.split('=', 1)[1]
            break
    
    if token:
        token_data = verify_token(token)
        if token_data:
            user_id = token_data.user_id
            chat_manager.add(user_id, sid)
            await sio.save_session(sid, {'user_id': user_id, 'username': token_data.username})
            return True
    
    return False

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    if session:
        user_id = session.get('user_id')
        if user_id:
            chat_manager.remove(user_id, sid)

@sio.event
async def send_message(sid, data):
    # data: {receiver_id, content, content_type, media_url?}
    session = await sio.get_session(sid)
    if not session:
        return {'status': 'error', 'reason': 'not authenticated'}
    
    sender_id = session.get('user_id')
    if not sender_id:
        return {'status': 'error', 'reason': 'invalid session'}
    
    ok = await MessageProcessor.validate(data)
    if not ok:
        return {'status': 'error', 'reason': 'invalid content type'}

    # create message document in Mongo (async)
    msg = Message(
        sender_id=sender_id,
        receiver_id=data.get('receiver_id'),
        content=data.get('content', ''),
        content_type=data.get('content_type', 'text')
    )
    if 'media_url' in data:
        msg.media_url = data['media_url']

    # save message
    try:
        await msg.insert()
    except Exception as e:
        print(f"Database error: {e}")
        # Don't fail if we can't save to MongoDB

    # emit to receiver sids
    receiver_id = data.get('receiver_id')
    sids = chat_manager.get_sids(receiver_id)
    for rsid in sids:
        await sio.emit('message', {
            'id': str(msg.id) if hasattr(msg, 'id') else None,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': msg.content,
            'content_type': msg.content_type,
            'media_url': msg.media_url,
            'created_at': msg.created_at.isoformat() if hasattr(msg, 'created_at') else None
        }, to=rsid)

    return {'status': 'ok'}

@sio.event
async def send_buzz(sid, data):
    # data: {receiver_id}
    session = await sio.get_session(sid)
    if not session:
        return {'status': 'error', 'reason': 'not authenticated'}
    
    sender_id = session.get('user_id')
    receiver_id = data.get('receiver_id')
    
    if not can_buzz(sender_id):
        return {'status': 'error', 'reason': 'cooldown'}

    # emit buzz event to receiver
    sids = chat_manager.get_sids(receiver_id)
    for rsid in sids:
        await sio.emit('buzz', {'from': sender_id}, to=rsid)

    # record buzz as a message in Mongo
    try:
        msg = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content='buzz',
            content_type='buzz'
        )
        await msg.insert()
    except Exception as e:
        print(f"Could not save buzz: {e}")

    return {'status': 'ok'}

