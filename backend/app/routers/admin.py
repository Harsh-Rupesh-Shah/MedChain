import logging
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.app.database import db_manager
from backend.app.auth.security import require_role

logger = logging.getLogger("medchain.admin")
router = APIRouter(prefix="/admin", tags=["admin"])

class VerifyDoctorRequest(BaseModel):
    status: str

@router.get("/pending-doctors")
async def get_pending_doctors(admin: dict = Depends(require_role(["admin"]))):
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")

    pending_users = await users_col.find({"role": "doctor", "verificationStatus": "pending"}).to_list()
    result = []
    for user in pending_users:
        doc_profile = await doctors_col.find_one({"user": str(user["_id"])}) or {}
        id_card = doc_profile.get("idCardImage", "")
        if id_card and not id_card.startswith("/") and not id_card.startswith("http"):
            id_card = f"/{id_card}"
        result.append({
            "_id": str(user["_id"]),
            "email": user.get("email"),
            "name": doc_profile.get("name", "Doctor"),
            "specialization": doc_profile.get("specialization", "General"),
            "licenseNumber": doc_profile.get("licenseNumber", "N/A"),
            "experience": doc_profile.get("experience", 1),
            "idCardImage": id_card,
            "createdAt": user.get("createdAt", "")
        })
    return result

@router.put("/verify-doctor/{doctor_id}")
async def verify_doctor(
    doctor_id: str,
    req: VerifyDoctorRequest,
    admin: dict = Depends(require_role(["admin"]))
):
    if req.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"_id": doctor_id})
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found")

    await users_col.update_one(
        {"_id": doctor_id},
        {"$set": {
            "verificationStatus": req.status,
            "isVerified": (req.status == "approved")
        }}
    )

    return {"message": f"Doctor {req.status} successfully"}

