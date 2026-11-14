import logging
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body
from backend.app.database import db_manager
from backend.app.auth.security import get_current_user
from backend.app.services.socket import sio

logger = logging.getLogger("medchain.messages")
router = APIRouter(prefix="/messages", tags=["messages"])
chat_router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    messages_col = db_manager.get_collection("messages")
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    all_messages = await messages_col.find({
        "$or": [{"sender": user_id}, {"receiver": user_id}]
    }).sort("createdAt", -1).to_list()

    conversations_map = {}
    for m in all_messages:
        other_id = m.get("receiver") if m.get("sender") == user_id else m.get("sender")
        if other_id and other_id not in conversations_map:
            conversations_map[other_id] = m

    result = []
    for other_id, last_msg in conversations_map.items():
        other_user = await users_col.find_one({"_id": other_id}) or {}
        # Try to find display name from doctors or patients
        name = "User"
        doc = await doctors_col.find_one({"user": other_id})
        if doc:
            name = doc.get("name", "Doctor")
        else:
            pat = await patients_col.find_one({"user": other_id})
            if pat:
                name = pat.get("name", "Patient")

        result.append({
            "user": {
                "_id": str(other_user.get("_id", other_id)),
                "name": name,
                "role": other_user.get("role", "patient")
            },
            "lastMessage": last_msg
        })

    return result

@router.get("/{other_user_id}")
@chat_router.get("/{other_user_id}")
async def get_messages_with_user(
    other_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userId"]
    messages_col = db_manager.get_collection("messages")
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    # Resolve other_user_id if a doctor or patient profile ID was provided
    doc = await doctors_col.find_one({"_id": other_user_id})
    if doc and doc.get("user"):
        other_user_id = str(doc["user"])
    else:
        pat = await patients_col.find_one({"_id": other_user_id})
        if pat and pat.get("user"):
            other_user_id = str(pat["user"])

    messages = await messages_col.find({
        "$or": [
            {"sender": user_id, "receiver": other_user_id},
            {"sender": other_user_id, "receiver": user_id}
        ]
    }).sort("createdAt", 1).to_list()

    # Pre-fetch user profiles for populated fields
    async def get_user_summary(uid):
        u = await users_col.find_one({"_id": uid}) or {}
        name = "User"
        d = await doctors_col.find_one({"user": uid})
        if d:
            name = d.get("name", "Doctor")
        else:
            p = await patients_col.find_one({"user": uid})
            if p:
                name = p.get("name", "Patient")
        return {"_id": uid, "name": name, "role": u.get("role", "patient")}

    user_a = await get_user_summary(user_id)
    user_b = await get_user_summary(other_user_id)

    for m in messages:
        m["sender"] = user_a if m.get("sender") == user_id else user_b
        m["receiver"] = user_b if m.get("sender") == user_id else user_a

    return messages

@router.post("")
@router.post("/")
async def send_message(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userId"]
    receiver_id = body.get("receiverId")
    content = body.get("content", "")
    attachments = body.get("attachments", [])

    if not receiver_id:
        raise HTTPException(status_code=400, detail="receiverId is required")

    messages_col = db_manager.get_collection("messages")
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    # Resolve receiver_id if a profile ID was provided
    doc = await doctors_col.find_one({"_id": receiver_id})
    if doc and doc.get("user"):
        receiver_id = str(doc["user"])
    else:
        pat = await patients_col.find_one({"_id": receiver_id})
        if pat and pat.get("user"):
            receiver_id = str(pat["user"])

    new_msg = {
        "_id": str(ObjectId()),
        "sender": user_id,
        "receiver": receiver_id,
        "content": content,
        "attachments": attachments,
        "read": False,
        "createdAt": datetime.utcnow().isoformat()
    }
    await messages_col.insert_one(new_msg)

    async def get_summary(uid):
        u = await users_col.find_one({"_id": uid}) or {}
        name = "User"
        d = await doctors_col.find_one({"user": uid})
        if d:
            name = d.get("name", "Doctor")
        else:
            p = await patients_col.find_one({"user": uid})
            if p:
                name = p.get("name", "Patient")
        return {"_id": uid, "name": name, "role": u.get("role", "patient")}

    populated = dict(new_msg)
    populated["sender"] = await get_summary(user_id)
    populated["receiver"] = await get_summary(receiver_id)

    # Emit socket event
    try:
        await sio.emit("new_message", populated, room=f"user_{receiver_id}")
        await sio.emit("new_message", populated, room=f"user_{user_id}")
    except Exception as e:
        logger.warning(f"Could not emit socket event: {e}")

    return populated

@router.put("/read/{other_user_id}")
@chat_router.put("/read/{other_user_id}")
async def mark_messages_read(
    other_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userId"]
    messages_col = db_manager.get_collection("messages")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    doc = await doctors_col.find_one({"_id": other_user_id})
    if doc and doc.get("user"):
        other_user_id = str(doc["user"])
    else:
        pat = await patients_col.find_one({"_id": other_user_id})
        if pat and pat.get("user"):
            other_user_id = str(pat["user"])

    await messages_col.update_many(
        {"sender": other_user_id, "receiver": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Messages marked as read"}

