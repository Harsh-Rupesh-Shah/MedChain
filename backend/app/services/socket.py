import socketio
import jwt
import logging
from datetime import datetime
from backend.app.config import JWT_SECRET, CLIENT_URL
from backend.app.database import db_manager

logger = logging.getLogger("medchain.socket")

# Create Async Socket.IO Server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    logger=False,
    engineio_logger=False
)

@sio.event
async def connect(sid, environ, auth):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    if not token:
        logger.warning(f"Socket connection rejected: No token provided for sid {sid}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication error")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        async with sio.session(sid) as session:
            session["user"] = payload
        logger.info(f"Socket user connected: {payload.get('userId')} (sid: {sid})")
    except Exception as e:
        logger.warning(f"Socket connection rejected: Invalid token ({e})")
        raise socketio.exceptions.ConnectionRefusedError("Authentication error")

@sio.event
async def join_room(sid, data):
    user_id = data.get("userId")
    if user_id:
        room_name = f"user_{user_id}"
        await sio.enter_room(sid, room_name)
        logger.info(f"User {user_id} joined room {room_name}")

@sio.event
async def private_message(sid, data):
    try:
        async with sio.session(sid) as session:
            user = session.get("user", {})
            sender_id = user.get("userId")

        receiver_id = data.get("receiverId")
        content = data.get("content", "")
        attachments = data.get("attachments", [])

        if not sender_id or not receiver_id:
            await sio.emit("error", {"message": "Invalid sender or receiver"}, to=sid)
            return

        messages_col = db_manager.get_collection("messages")
        users_col = db_manager.get_collection("users")

        sender_user = await users_col.find_one({"_id": sender_id}) or {}
        receiver_user = await users_col.find_one({"_id": receiver_id}) or {}

        message_doc = {
            "sender": sender_id,
            "receiver": receiver_id,
            "content": content,
            "attachments": attachments,
            "read": False,
            "createdAt": datetime.utcnow().isoformat()
        }

        res = await messages_col.insert_one(message_doc)
        message_id = getattr(res, "inserted_id", None) or message_doc.get("_id")
        message_doc["_id"] = str(message_id)

        populated_message = {
            "_id": str(message_id),
            "sender": {
                "_id": sender_id,
                "name": sender_user.get("name", "User"),
                "role": sender_user.get("role", "patient")
            },
            "receiver": {
                "_id": receiver_id,
                "name": receiver_user.get("name", "User"),
                "role": receiver_user.get("role", "doctor")
            },
            "content": content,
            "attachments": attachments,
            "read": False,
            "createdAt": message_doc["createdAt"]
        }

        # Emit to both sender and receiver rooms
        await sio.emit("new_message", populated_message, room=f"user_{receiver_id}")
        await sio.emit("new_message", populated_message, room=f"user_{sender_id}")
    except Exception as e:
        logger.error(f"Error handling private_message: {e}")
        await sio.emit("error", {"message": "Failed to send message"}, to=sid)

@sio.event
async def typing(sid, data):
    async with sio.session(sid) as session:
        user = session.get("user", {})
        sender_id = user.get("userId")
    receiver_id = data.get("receiverId")
    if receiver_id and sender_id:
        await sio.emit("typing", {"userId": sender_id}, room=f"user_{receiver_id}")

@sio.event
async def stop_typing(sid, data):
    async with sio.session(sid) as session:
        user = session.get("user", {})
        sender_id = user.get("userId")
    receiver_id = data.get("receiverId")
    if receiver_id and sender_id:
        await sio.emit("stop_typing", {"userId": sender_id}, room=f"user_{receiver_id}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected (sid: {sid})")

