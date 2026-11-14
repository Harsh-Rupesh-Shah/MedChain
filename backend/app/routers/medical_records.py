import os
import time
import logging
from bson import ObjectId
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from backend.app.config import UPLOADS_DIR, BASE_DIR
from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import get_current_user

logger = logging.getLogger("medchain.medical_records")
router = APIRouter(prefix="/medical-records", tags=["medical-records"])

@router.get("/patient/{patient_id}")
async def get_patient_medical_records(patient_id: str, current_user: dict = Depends(get_current_user)):
    records_col = db_manager.get_collection("medical_records")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"_id": patient_id})
    if not patient:
        patient = await patients_col.find_one({"user": patient_id})

    p_user_id = str(patient.get("user", "")) if patient else patient_id
    p_id = str(patient.get("_id", "")) if patient else patient_id

    records = await records_col.find({
        "$or": [{"patient": p_user_id}, {"patient": p_id}]
    }).sort("date", -1).to_list()

    for r in records:
        doc_val = r.get("doctor")
        if isinstance(doc_val, dict):
            r["doctor"] = doc_val.get("name", "Attending Physician")
        elif doc_val:
            doc = await doctors_col.find_one({"$or": [{"_id": str(doc_val)}, {"user": str(doc_val)}]})
            if doc:
                r["doctor"] = doc.get("name", str(doc_val))
            else:
                r["doctor"] = str(doc_val)
        else:
            r["doctor"] = "Attending Physician"

    return convert_object_ids(records)

@router.get("")
@router.get("/")
async def get_my_medical_records(current_user: dict = Depends(get_current_user)):
    records_col = db_manager.get_collection("medical_records")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    records = await records_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).sort("date", -1).to_list()

    for r in records:
        doc_val = r.get("doctor")
        if isinstance(doc_val, dict):
            r["doctor"] = doc_val.get("name", "Attending Physician")
        elif doc_val:
            doc = await doctors_col.find_one({"$or": [{"_id": str(doc_val)}, {"user": str(doc_val)}]})
            if doc:
                r["doctor"] = doc.get("name", str(doc_val))
            else:
                r["doctor"] = str(doc_val)
        else:
            r["doctor"] = "Attending Physician"

    return convert_object_ids(records)

@router.delete("/{record_id}")
async def delete_medical_record(record_id: str, current_user: dict = Depends(get_current_user)):
    records_col = db_manager.get_collection("medical_records")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    res = await records_col.delete_one({
        "_id": record_id,
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    })
    if not res:
        # Also allow deletion by record_id alone if creator
        res = await records_col.delete_one({"_id": record_id})
    return {"message": "Record deleted successfully"}

@router.post("")
@router.post("/")
async def create_medical_record(
    type: str = Form(...),
    title: str = Form(...),
    date: str = Form(...),
    doctor: str = Form(None),
    description: str = Form(None),
    attachments: list[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    records_col = db_manager.get_collection("medical_records")
    saved_attachments = []

    if attachments:
        for f in attachments:
            if f.filename:
                unique_name = f"{int(time.time()*1000)}-{f.filename}"
                dest = UPLOADS_DIR / "medical-records" / unique_name
                dest.parent.mkdir(parents=True, exist_ok=True)
                content = await f.read()
                with open(dest, "wb") as out_f:
                    out_f.write(content)
                saved_attachments.append({
                    "filename": unique_name,
                    "originalName": f.filename,
                    "path": f"uploads/medical-records/{unique_name}",
                    "mimetype": f.content_type
                })

    new_record = {
        "_id": str(ObjectId()),
        "patient": current_user["userId"],
        "type": type,
        "title": title,
        "date": date,
        "doctor": doctor or "",
        "description": description or "",
        "attachments": saved_attachments,
        "createdAt": datetime.utcnow().isoformat()
    }
    await records_col.insert_one(new_record)
    return convert_object_ids(new_record)

@router.get("/{record_id}/download/{filename}")
async def download_record_attachment(
    record_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    import mimetypes
    # Check in server/uploads/medical-records or uploads/medical-records
    filepath = UPLOADS_DIR / "medical-records" / filename
    if not filepath.exists():
        filepath = BASE_DIR / "uploads" / "medical-records" / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content_type, _ = mimetypes.guess_type(str(filepath))
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type=content_type or "application/octet-stream",
        content_disposition_type="inline"
    )

