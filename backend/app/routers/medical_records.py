import os
import time
import logging
import mimetypes
from bson import ObjectId
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import FileResponse

from backend.app.config import UPLOADS_DIR, BASE_DIR
from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import get_current_user
from backend.app.services.upload_validator import (
    validate_and_read_upload,
    ALLOWED_RECORD_EXTENSIONS,
    ALLOWED_RECORD_MIMES,
    MAX_RECORD_SIZE
)

logger = logging.getLogger("medchain.medical_records")
router = APIRouter(prefix="/medical-records", tags=["medical-records"])

async def verify_record_access(current_user: dict, patient_user_id: str, patient_profile_id: str = ""):
    """
    Verifies that the requester is entitled to access this patient's medical records.
    Allowed entities:
      - Admin
      - The patient themselves
      - A verified doctor with an existing scheduled or completed appointment with this patient
    """
    role = current_user.get("role")
    req_user_id = str(current_user.get("userId", ""))

    # 1. Admin has supervisory clearance
    if role == "admin":
        return

    # 2. Patient requesting their own records
    if role == "patient":
        if req_user_id == str(patient_user_id) or (patient_profile_id and req_user_id == str(patient_profile_id)):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view another patient's medical records"
        )

    # 3. Doctor requesting records for a patient
    if role == "doctor":
        # Must be an approved/verified clinician
        users_col = db_manager.get_collection("users")
        doc_user = await users_col.find_one({"_id": req_user_id})
        if not doc_user or not doc_user.get("isVerified") or doc_user.get("verificationStatus") != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Doctor account pending verification or not approved"
            )

        doctors_col = db_manager.get_collection("doctors")
        doc_profile = await doctors_col.find_one({"user": req_user_id})
        doc_id = str(doc_profile["_id"]) if doc_profile else req_user_id

        # Must have an authorized doctor-patient relationship established via appointment
        appointments_col = db_manager.get_collection("appointments")
        apt = await appointments_col.find_one({
            "$or": [{"doctor": doc_id}, {"doctor": req_user_id}],
            "$or": [
                {"patient": str(patient_user_id)},
                {"patient": str(patient_profile_id)}
            ]
        })
        if apt:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: No authorized doctor-patient consultation relationship found for this patient"
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Insufficient permissions to view medical records"
    )

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

    # Enforce authorization
    await verify_record_access(current_user, p_user_id, p_id)

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

    # Locate record first
    record = await records_col.find_one({"_id": record_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    # Verify patient ownership (or admin authority)
    is_owner = record.get("patient") in [current_user["userId"], p_id]
    is_admin = current_user.get("role") == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to delete this medical record"
        )

    res = await records_col.delete_one({"_id": record_id})
    deleted_count = getattr(res, "deleted_count", 1 if res else 0)
    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record could not be deleted"
        )

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
                clean_name, content = await validate_and_read_upload(
                    f,
                    allowed_extensions=ALLOWED_RECORD_EXTENSIONS,
                    allowed_mimes=ALLOWED_RECORD_MIMES,
                    max_size_bytes=MAX_RECORD_SIZE,
                    field_label="Medical record attachment"
                )
                unique_name = f"{int(time.time()*1000)}-{clean_name}"
                dest = UPLOADS_DIR / "medical-records" / unique_name
                dest.parent.mkdir(parents=True, exist_ok=True)
                with open(dest, "wb") as out_f:
                    out_f.write(content)
                saved_attachments.append({
                    "filename": unique_name,
                    "originalName": clean_name,
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
    records_col = db_manager.get_collection("medical_records")
    record = await records_col.find_one({"_id": record_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )

    # Sanitize and prevent path traversal
    clean_req_filename = Path(filename).name
    if ".." in clean_req_filename or "/" in clean_req_filename or "\\" in clean_req_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename path specification"
        )

    # Verify that the requested file is actually attached to this record
    record_attachments = record.get("attachments", [])
    matching_attachment = None
    for att in record_attachments:
        att_filename = Path(att.get("filename", "")).name
        att_orig = Path(att.get("originalName", "")).name
        att_path = Path(att.get("path", "")).name
        if clean_req_filename in (att_filename, att_orig, att_path):
            matching_attachment = att
            break

    if not matching_attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File attachment is not associated with this medical record"
        )

    # Check access authorization for the record
    patients_col = db_manager.get_collection("patients")
    patient = await patients_col.find_one({"user": record.get("patient")}) or {}
    p_user_id = str(record.get("patient", ""))
    p_id = str(patient.get("_id", ""))

    await verify_record_access(current_user, p_user_id, p_id)

    # Resolve disk file
    actual_disk_filename = Path(matching_attachment.get("filename", clean_req_filename)).name
    filepath = UPLOADS_DIR / "medical-records" / actual_disk_filename
    if not filepath.exists():
        filepath = BASE_DIR / "uploads" / "medical-records" / actual_disk_filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment file not found on disk")

    content_type, _ = mimetypes.guess_type(str(filepath))
    return FileResponse(
        path=str(filepath),
        filename=matching_attachment.get("originalName") or clean_req_filename,
        media_type=content_type or "application/octet-stream",
        content_disposition_type="inline"
    )
