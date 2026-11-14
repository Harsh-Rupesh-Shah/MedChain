import logging
import mimetypes
from pathlib import Path
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.app.config import UPLOADS_DIR, BASE_DIR
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
        raw_id_card = doc_profile.get("idCardImage", "")
        # Provide authenticated admin retrieval endpoint for doctor ID preview
        id_card_endpoint = f"/api/admin/doctor-id/{str(user['_id'])}" if raw_id_card else ""
        result.append({
            "_id": str(user["_id"]),
            "email": user.get("email"),
            "name": doc_profile.get("name", "Doctor"),
            "specialization": doc_profile.get("specialization", "General"),
            "licenseNumber": doc_profile.get("licenseNumber", "N/A"),
            "experience": doc_profile.get("experience", 1),
            "idCardImage": id_card_endpoint,
            "rawIdCardName": Path(raw_id_card).name if raw_id_card else "",
            "createdAt": user.get("createdAt", "")
        })
    return result

@router.get("/doctor-id/{doctor_id}")
async def get_doctor_id_image(
    doctor_id: str,
    admin: dict = Depends(require_role(["admin"]))
):
    """Securely stream doctor ID card to verified administrators with authorization check."""
    doctors_col = db_manager.get_collection("doctors")
    doc_profile = await doctors_col.find_one({"$or": [{"user": doctor_id}, {"_id": doctor_id}]})
    if not doc_profile or not doc_profile.get("idCardImage"):
        raise HTTPException(status_code=404, detail="Doctor ID document not found")

    raw_filename = Path(doc_profile["idCardImage"]).name
    # Prevent path traversal
    if ".." in raw_filename or "/" in raw_filename or "\\" in raw_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    filepath = UPLOADS_DIR / "doctor-ids" / raw_filename
    if not filepath.exists():
        filepath = BASE_DIR / "uploads" / "doctor-ids" / raw_filename
    if not filepath.exists():
        filepath = UPLOADS_DIR / raw_filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="ID document file not found")

    content_type, _ = mimetypes.guess_type(str(filepath))
    return FileResponse(
        path=str(filepath),
        filename=raw_filename,
        media_type=content_type or "application/octet-stream",
        content_disposition_type="inline"
    )

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

