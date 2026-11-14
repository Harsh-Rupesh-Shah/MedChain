import time
import os
import logging
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Body
from pathlib import Path
from backend.app.config import UPLOADS_DIR, BASE_DIR
from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import require_role, hash_password, verify_password, get_current_user
from backend.app.auth.face import verify_face
from backend.app.services.upload_validator import (
    validate_and_read_upload,
    ALLOWED_RECORD_EXTENSIONS,
    ALLOWED_RECORD_MIMES,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_MIMES,
    MAX_RECORD_SIZE,
    MAX_IMAGE_SIZE
)

logger = logging.getLogger("medchain.patients")
router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/profile")
async def get_patient_profile(current_user: dict = Depends(require_role(["patient"]))):
    patients_col = db_manager.get_collection("patients")
    doctors_col = db_manager.get_collection("doctors")

    patient = await patients_col.find_one({"user": current_user["userId"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Populate doctor references in medicalHistory and prescriptions
    for item in patient.get("medicalHistory", []):
        if item.get("doctor"):
            doc = await doctors_col.find_one({"_id": str(item["doctor"])}) or {}
            item["doctor"] = {"name": doc.get("name", "Doctor"), "specialization": doc.get("specialization", "")}

    for item in patient.get("prescriptions", []):
        if item.get("doctor"):
            doc = await doctors_col.find_one({"_id": str(item["doctor"])}) or {}
            item["doctor"] = {"name": doc.get("name", "Doctor"), "specialization": doc.get("specialization", "")}

    return patient

@router.put("/profile")
async def update_patient_profile(
    body: dict = Body(...),
    current_user: dict = Depends(require_role(["patient"]))
):
    patients_col = db_manager.get_collection("patients")

    allowed_fields = [
        "name", "phone", "address", "dateOfBirth", "gender",
        "bloodGroup", "allergies", "chronicConditions", "emergencyContact"
    ]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}

    await patients_col.update_one(
        {"user": current_user["userId"]},
        {"$set": update_data}
    )

    updated = await patients_col.find_one({"user": current_user["userId"]})
    return updated

@router.get("/records")
async def get_patient_records(current_user: dict = Depends(require_role(["patient"]))):
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

@router.post("/records")
async def create_patient_record(
    type: str = Form(...),
    title: str = Form(...),
    date: str = Form(...),
    doctor: str = Form(None),
    description: str = Form(None),
    attachments: list[UploadFile] = File(None),
    current_user: dict = Depends(require_role(["patient"]))
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
        "doctor": doctor,
        "description": description,
        "attachments": saved_attachments,
        "createdAt": datetime.utcnow().isoformat()
    }
    await records_col.insert_one(new_record)
    return convert_object_ids(new_record)

@router.delete("/records/{record_id}")
async def delete_patient_record(
    record_id: str,
    current_user: dict = Depends(require_role(["patient"]))
):
    records_col = db_manager.get_collection("medical_records")
    res = await records_col.delete_one({"_id": record_id, "patient": current_user["userId"]})
    deleted_count = getattr(res, "deleted_count", 1 if res else 0)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found or access denied")
    return {"message": "Record deleted successfully"}

@router.post("/verify-face")
async def verify_patient_face(
    face: UploadFile = File(...),
    current_user: dict = Depends(require_role(["patient"]))
):
    patients_col = db_manager.get_collection("patients")
    patient = await patients_col.find_one({"user": current_user["userId"]})
    if not patient or not patient.get("biometricData", {}).get("image"):
        raise HTTPException(status_code=404, detail="No face data found for this patient")

    clean_name, content = await validate_and_read_upload(
        face,
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
        allowed_mimes=ALLOWED_IMAGE_MIMES,
        max_size_bytes=MAX_IMAGE_SIZE,
        field_label="Verification face image"
    )

    filename = f"{int(time.time()*1000)}-verify-face.jpg"
    dest = UPLOADS_DIR / "faces" / filename
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        f.write(content)

    stored_image_rel = patient["biometricData"]["image"].lstrip("/")
    stored_path = BASE_DIR / stored_image_rel
    if not stored_path.exists():
        stored_path = BASE_DIR / "server" / stored_image_rel
    if not stored_path.exists():
        stored_path = UPLOADS_DIR / "faces" / Path(stored_image_rel).name

    match = await verify_face(str(dest), str(stored_path))
    if not match:
        raise HTTPException(status_code=401, detail="Face recognition failed")

    return {
        "verified": True,
        "message": "Face verified successfully",
        "user": {
            "_id": current_user["userId"],
            "name": patient.get("name", "Patient")
        }
    }

@router.put("/password")
async def update_patient_password(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    users_col = db_manager.get_collection("users")
    current_pwd = body.get("currentPassword", "")
    new_pwd = body.get("newPassword", "")

    user = await users_col.find_one({"_id": current_user["userId"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(current_pwd, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await users_col.update_one(
        {"_id": current_user["userId"]},
        {"$set": {"password": hash_password(new_pwd)}}
    )
    return {"message": "Password updated successfully"}

@router.put("/notifications")
async def update_patient_notifications(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    patients_col = db_manager.get_collection("patients")
    doctors_col = db_manager.get_collection("doctors")

    if current_user.get("role") == "doctor":
        await doctors_col.update_one(
            {"user": current_user["userId"]},
            {"$set": {"notificationSettings": body}}
        )
        doc = await doctors_col.find_one({"user": current_user["userId"]}) or {}
        return doc.get("notificationSettings", body)

    await patients_col.update_one(
        {"user": current_user["userId"]},
        {"$set": {"notificationSettings": body}}
    )
    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    return patient.get("notificationSettings", {})

@router.get("/metrics")
async def get_patient_metrics(current_user: dict = Depends(get_current_user)):
    patients_col = db_manager.get_collection("patients")
    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    metrics = patient.get("healthMetrics", [])
    if not metrics:
        default_metric = {
            "date": datetime.utcnow().isoformat(),
            "heartRate": 72,
            "bloodPressure": {"systolic": 120, "diastolic": 80},
            "weight": 70,
            "steps": 8200
        }
        return [default_metric]
    return metrics

@router.post("/metrics")
async def add_patient_metrics(
    body: dict = Body(...),
    current_user: dict = Depends(require_role(["patient"]))
):
    patients_col = db_manager.get_collection("patients")
    metric_entry = {
        "date": datetime.utcnow().isoformat(),
        "heartRate": int(body.get("heartRate", 72)),
        "bloodPressure": {
            "systolic": int(body.get("systolic", 120)),
            "diastolic": int(body.get("diastolic", 80))
        },
        "weight": float(body.get("weight", 70)),
        "steps": int(body.get("steps", 8000))
    }
    await patients_col.update_one(
        {"user": current_user["userId"]},
        {"$push": {"healthMetrics": metric_entry}}
    )
    return {"message": "Health vitals updated successfully", "metric": metric_entry}

@router.get("/analytics")
async def get_patient_analytics(current_user: dict = Depends(require_role(["patient"]))):
    appointments_col = db_manager.get_collection("appointments")
    records_col = db_manager.get_collection("medical_records")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    apts = await appointments_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).to_list()

    records = await records_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).to_list()

    by_type = {}
    for r in records:
        t = r.get("type", "other")
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "appointments": {
            "total": len(apts),
            "upcoming": sum(1 for a in apts if a.get("status") == "scheduled"),
            "completed": sum(1 for a in apts if a.get("status") == "completed")
        },
        "records": {
            "total": len(records),
            "byType": by_type
        }
    }

@router.get("/prescriptions")
async def get_patient_prescriptions(current_user: dict = Depends(require_role(["patient"]))):
    prescriptions_col = db_manager.get_collection("prescriptions")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    prescriptions = await prescriptions_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).sort("date", -1).to_list()

    for p in prescriptions:
        if p.get("doctor"):
            doc = await doctors_col.find_one({"_id": str(p["doctor"])}) or {}
            p["doctor"] = {"name": doc.get("name", "Doctor"), "specialization": doc.get("specialization", "")}

    return prescriptions

@router.get("/medication-reminders")
async def get_patient_medication_reminders(current_user: dict = Depends(require_role(["patient"]))):
    prescriptions_col = db_manager.get_collection("prescriptions")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    active_prescriptions = await prescriptions_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}],
        "status": "active"
    }).to_list()

    reminders = []
    for p in active_prescriptions:
        for med in p.get("medications", []):
            freq = med.get("frequency", "Once Daily").lower()
            times = ["09:00"]
            if "twice" in freq:
                times = ["09:00", "21:00"]
            elif "three" in freq:
                times = ["09:00", "15:00", "21:00"]

            for t in times:
                reminders.append({
                    "_id": f"{p['_id']}-{med.get('name')}-{t}",
                    "medicationName": med.get("name", "Medicine"),
                    "time": t,
                    "taken": med.get("status") == "completed"
                })

    return reminders

@router.put("/medication-reminders/{reminder_id}/taken")
async def mark_reminder_taken(
    reminder_id: str,
    current_user: dict = Depends(require_role(["patient"]))
):
    return {"message": "Reminder marked as taken"}

@router.get("/appointments/stats")
async def get_patient_appointment_stats(current_user: dict = Depends(require_role(["patient"]))):
    appointments_col = db_manager.get_collection("appointments")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    apts = await appointments_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).to_list()

    return {
        "total": len(apts),
        "upcoming": sum(1 for a in apts if a.get("status") == "scheduled"),
        "completed": sum(1 for a in apts if a.get("status") == "completed")
    }

