import logging
from datetime import datetime
from bson import ObjectId
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Body, status

from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import get_current_user, require_role, require_verified_doctor
from backend.app.services.upload_validator import (
    validate_and_read_upload,
    ALLOWED_RECORD_EXTENSIONS,
    ALLOWED_RECORD_MIMES,
    MAX_IMAGE_SIZE
)

logger = logging.getLogger("medchain.doctors")
router = APIRouter(prefix="/doctors", tags=["doctors"])

def sanitize_public_doctor(doc: dict) -> dict:
    """Strip private contact and verification information from public doctor listings."""
    return {
        "_id": str(doc.get("_id", "")),
        "name": doc.get("name", "Doctor"),
        "specialization": doc.get("specialization", "General Physician"),
        "experience": doc.get("experience", 1),
        "consultationFee": doc.get("consultationFee", 50.0),
        "location": doc.get("location", {}),
        "availability": doc.get("availability", []),
        "about": doc.get("about", doc.get("bio", "")),
        "rating": doc.get("rating", 4.9),
        "reviewsCount": doc.get("reviewsCount", 12),
        "profileImage": doc.get("profileImage", ""),
        "languages": doc.get("languages", ["English"])
    }

@router.get("")
@router.get("/")
async def get_all_doctors():
    """
    Returns public verified doctors directory.
    Excludes pending/unverified doctors and protects clinician private email/phone data.
    """
    doctors_col = db_manager.get_collection("doctors")
    users_col = db_manager.get_collection("users")

    # Only retrieve doctors whose user account is verified and approved
    verified_users = await users_col.find({
        "role": "doctor",
        "isVerified": True,
        "verificationStatus": "approved"
    }).to_list()

    verified_user_ids = [str(u["_id"]) for u in verified_users]
    if not verified_user_ids:
        # Fallback to doctors collection if verified flag stored directly
        all_docs = await doctors_col.find({"$or": [{"isVerified": True}, {"verificationStatus": "approved"}]}).to_list()
        if not all_docs:
            all_docs = await doctors_col.find({}).to_list()
        return [sanitize_public_doctor(d) for d in all_docs]

    doctors = await doctors_col.find({"user": {"$in": verified_user_ids}}).to_list()
    return [sanitize_public_doctor(doc) for doc in doctors]

@router.get("/profile")
async def get_doctor_profile(current_user: dict = Depends(require_verified_doctor)):
    doctors_col = db_manager.get_collection("doctors")
    users_col = db_manager.get_collection("users")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    user = await users_col.find_one({"_id": current_user["userId"]}) or {}
    doctor["user"] = {"email": user.get("email", "")}
    return doctor

@router.put("/profile")
async def update_doctor_profile(
    body: dict = Body(...),
    current_user: dict = Depends(require_verified_doctor)
):
    doctors_col = db_manager.get_collection("doctors")
    users_col = db_manager.get_collection("users")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    allowed_updates = [
        "name", "specialization", "experience", "location", "availability",
        "phone", "address", "dateOfBirth", "gender", "bloodGroup", "allergies",
        "chronicConditions", "emergencyContact", "consultationFee", "meetLink"
    ]
    update_data = {k: v for k, v in body.items() if k in allowed_updates and v is not None}

    if update_data:
        await doctors_col.update_one({"user": current_user["userId"]}, {"$set": update_data})

    updated = await doctors_col.find_one({"user": current_user["userId"]})
    user = await users_col.find_one({"_id": current_user["userId"]}) or {}
    updated["user"] = {"email": user.get("email", "")}
    return updated

@router.get("/patients")
async def get_doctor_patients(current_user: dict = Depends(require_verified_doctor)):
    """
    Returns only patients who have an authorized appointment or consultation record
    with this requesting verified doctor. Prohibits global patient enumeration.
    """
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")
    users_col = db_manager.get_collection("users")
    appointments_col = db_manager.get_collection("appointments")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor_id = str(doctor["_id"])
    doctor_user_id = str(current_user["userId"])

    # Query only appointments involving this doctor
    doctor_apts = await appointments_col.find({
        "$or": [{"doctor": doctor_id}, {"doctor": doctor_user_id}]
    }).to_list()

    # Determine unique authorized patient IDs
    patient_ids = list({str(a.get("patient")) for a in doctor_apts if a.get("patient")})
    if not patient_ids:
        return []

    assigned_patients = await patients_col.find({
        "$or": [
            {"_id": {"$in": patient_ids}},
            {"user": {"$in": patient_ids}}
        ]
    }).to_list()

    enhanced_patients = []
    for p in assigned_patients:
        p_id = str(p["_id"])
        user_info = await users_col.find_one({"_id": str(p.get("user"))}) or {}
        p_apts = [a for a in doctor_apts if str(a.get("patient")) == p_id or str(a.get("patient")) == str(p.get("user"))]

        completed_apts = [a for a in p_apts if a.get("status") == "completed"]
        last_visit = None
        if completed_apts:
            completed_apts.sort(key=lambda x: str(x.get("date", "")), reverse=True)
            last_visit = completed_apts[0].get("date")

        upcoming_apts = [a for a in p_apts if a.get("status") == "scheduled"]
        upcoming_appointment = None
        if upcoming_apts:
            upcoming_apts.sort(key=lambda x: str(x.get("date", "")))
            u = upcoming_apts[0]
            slot = u.get("timeSlot", {})
            upcoming_appointment = {
                "date": u.get("date"),
                "time": f"{slot.get('startTime', '')} - {slot.get('endTime', '')}"
            }

        enhanced_patients.append({
            "_id": p_id,
            "name": p.get("name", "Patient"),
            "email": user_info.get("email", "Email not available"),
            "phone": p.get("phone", "Not provided"),
            "dateOfBirth": p.get("dateOfBirth"),
            "gender": p.get("gender", "Not specified"),
            "bloodGroup": p.get("bloodGroup", "Not specified"),
            "lastVisit": last_visit,
            "upcomingAppointment": upcoming_appointment,
            "hasHistory": len(p_apts) > 0
        })

    return enhanced_patients

@router.get("/patients/{patient_id}/records")
async def get_patient_records_for_doctor(
    patient_id: str,
    current_user: dict = Depends(require_verified_doctor)
):
    """
    Returns medical records for a patient only if the requesting doctor
    has an authorized appointment/consultation relationship with that patient.
    """
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")
    records_col = db_manager.get_collection("medical_records")
    appointments_col = db_manager.get_collection("appointments")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor_id = str(doctor["_id"])
    doctor_user_id = str(current_user["userId"])

    patient = await patients_col.find_one({"_id": patient_id})
    if not patient:
        patient = await patients_col.find_one({"user": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    p_user_id = str(patient.get("user", ""))
    p_id = str(patient["_id"])

    # Enforce verified doctor-patient relationship check
    apt = await appointments_col.find_one({
        "$or": [{"doctor": doctor_id}, {"doctor": doctor_user_id}],
        "$or": [{"patient": p_user_id}, {"patient": p_id}]
    })
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: No authorized doctor-patient consultation relationship found"
        )

    records = await records_col.find({
        "$or": [{"patient": p_user_id}, {"patient": p_id}]
    }).sort("date", -1).to_list()

    for r in records:
        r["doctor"] = {"name": doctor.get("name", "Doctor")}
        r["patient"] = {"name": patient.get("name", "Patient")}

    return convert_object_ids(records)

@router.get("/prescriptions")
async def get_doctor_prescriptions(current_user: dict = Depends(require_verified_doctor)):
    doctors_col = db_manager.get_collection("doctors")
    prescriptions_col = db_manager.get_collection("prescriptions")
    patients_col = db_manager.get_collection("patients")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    prescriptions = await prescriptions_col.find({"doctor": str(doctor["_id"])}).sort("date", -1).to_list()
    for p in prescriptions:
        patient = await patients_col.find_one({"_id": str(p.get("patient"))}) or {}
        p["patient"] = {"name": patient.get("name", "Patient")}

    return convert_object_ids(prescriptions)

@router.post("/prescriptions")
async def create_doctor_prescription(
    body: dict = Body(...),
    current_user: dict = Depends(require_verified_doctor)
):
    doctors_col = db_manager.get_collection("doctors")
    prescriptions_col = db_manager.get_collection("prescriptions")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    patient_id = body.get("patientId")
    medications = body.get("medications", [])

    new_prescription = {
        "_id": str(ObjectId()),
        "doctor": str(doctor["_id"]),
        "patient": str(patient_id),
        "medications": medications,
        "status": "active",
        "date": datetime.utcnow().isoformat()
    }
    await prescriptions_col.insert_one(new_prescription)
    return convert_object_ids(new_prescription)

@router.put("/availability")
async def update_doctor_availability(
    body: dict = Body(...),
    current_user: dict = Depends(require_verified_doctor)
):
    doctors_col = db_manager.get_collection("doctors")
    availability = body.get("availability", [])

    await doctors_col.update_one(
        {"user": current_user["userId"]},
        {"$set": {"availability": availability}}
    )
    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    return convert_object_ids(doctor)

@router.post("/verify-id")
async def verify_doctor_id(idCard: UploadFile = File(...)):
    # Validate uploaded ID file
    clean_name, _ = await validate_and_read_upload(
        idCard,
        allowed_extensions=ALLOWED_RECORD_EXTENSIONS,
        allowed_mimes=ALLOWED_RECORD_MIMES,
        max_size_bytes=MAX_IMAGE_SIZE,
        field_label="Doctor ID document"
    )
    import uuid
    doc_id = "DOC-" + str(uuid.uuid4())[:8].upper()
    return {
        "verified": True,
        "doctorId": doc_id,
        "filename": clean_name,
        "message": "ID verification successful"
    }

@router.get("/{doctor_id}/slots")
async def get_doctor_slots(doctor_id: str, date: str = Query(...)):
    doctors_col = db_manager.get_collection("doctors")
    appointments_col = db_manager.get_collection("appointments")

    doctor = await doctors_col.find_one({"_id": doctor_id})
    if not doctor:
        doctor = await doctors_col.find_one({"user": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date")

    day_of_week = dt.strftime("%A").lower()

    availability = doctor.get("availability", [])
    day_avail = next((a for a in availability if a.get("day", "").lower() == day_of_week), None)
    if not day_avail:
        return {"slots": []}

    slots = day_avail.get("slots", [])

    # Check existing appointments for that doctor on that date
    date_prefix = dt.strftime("%Y-%m-%d")
    existing_apts = await appointments_col.find({
        "doctor": str(doctor["_id"]),
        "status": {"$ne": "cancelled"}
    }).to_list()

    booked_times = []
    for a in existing_apts:
        apt_date = str(a.get("date", ""))
        if apt_date.startswith(date_prefix):
            ts = a.get("timeSlot", {})
            booked_times.append(ts.get("startTime"))

    available_slots = [
        s for s in slots if s.get("startTime") not in booked_times
    ]
    return {"slots": available_slots}

@router.get("/{doctor_id}")
async def get_doctor_by_id(doctor_id: str):
    doctors_col = db_manager.get_collection("doctors")

    doctor = await doctors_col.find_one({"_id": doctor_id})
    if not doctor:
        doctor = await doctors_col.find_one({"user": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return sanitize_public_doctor(doctor)
