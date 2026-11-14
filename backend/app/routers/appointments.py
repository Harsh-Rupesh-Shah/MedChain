import logging
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import get_current_user
from backend.app.services.email import send_appointment_email, generate_google_meet_link

logger = logging.getLogger("medchain.appointments")
router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("")
@router.get("/")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    role = current_user.get("role")

    appointments_col = db_manager.get_collection("appointments")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")
    users_col = db_manager.get_collection("users")

    if role == "doctor":
        doctor = await doctors_col.find_one({"user": user_id}) or {}
        doc_id = str(doctor.get("_id", ""))
        query = {"$or": [{"doctor": user_id}, {"doctor": doc_id}]}
    elif role == "patient":
        patient = await patients_col.find_one({"user": user_id}) or {}
        p_id = str(patient.get("_id", ""))
        query = {"$or": [{"patient": user_id}, {"patient": p_id}]}
    else:
        query = {}

    appointments = await appointments_col.find(query).sort("date", -1).to_list()

    # Populate doctor and patient details
    for apt in appointments:
        doc = await doctors_col.find_one({"_id": str(apt.get("doctor"))})
        if not doc:
            doc = await doctors_col.find_one({"user": str(apt.get("doctor"))}) or {}
        apt["doctor"] = {
            "_id": str(doc.get("_id", "")),
            "name": doc.get("name", "Doctor"),
            "specialization": doc.get("specialization", "General"),
            "consultationFee": doc.get("consultationFee", 50)
        }

        pat = await patients_col.find_one({"_id": str(apt.get("patient"))})
        if not pat:
            pat = await patients_col.find_one({"user": str(apt.get("patient"))}) or {}
        pat_user = await users_col.find_one({"_id": str(pat.get("user"))}) or {}
        apt["patient"] = {
            "_id": str(pat.get("_id", "")),
            "name": pat.get("name", "Patient"),
            "phone": pat.get("phone", ""),
            "email": pat_user.get("email", "")
        }

    return convert_object_ids(appointments)

@router.post("")
@router.post("/")
async def create_appointment(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    appointments_col = db_manager.get_collection("appointments")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")
    users_col = db_manager.get_collection("users")

    doctor_id = body.get("doctorId") or body.get("doctor")
    date_str = body.get("date")
    time_slot = body.get("timeSlot", {})
    apt_type = body.get("type", "in-person")
    symptoms = body.get("symptoms", [])
    notes = body.get("notes", "")

    if not doctor_id or not date_str or not time_slot:
        raise HTTPException(status_code=400, detail="Doctor ID, date, and time slot are required")

    doctor = await doctors_col.find_one({"_id": str(doctor_id)})
    if not doctor:
        doctor = await doctors_col.find_one({"user": str(doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    target_patient_id = body.get("patientId") or body.get("patient")
    if target_patient_id:
        patient = await patients_col.find_one({"_id": str(target_patient_id)})
        if not patient:
            patient = await patients_col.find_one({"user": str(target_patient_id)})
    else:
        patient = await patients_col.find_one({"user": current_user["userId"]})
        if not patient:
            patient = await patients_col.find_one({"_id": current_user["userId"]})

    if not patient:
        patient = {
            "_id": str(ObjectId()),
            "user": current_user["userId"],
            "name": current_user.get("email", "Patient")
        }
        await patients_col.insert_one(patient)

    patient_id = str(patient["_id"])
    doctor_obj_id = str(doctor["_id"])

    meet_link = (
        body.get("meetLink")
        or doctor.get("meetLink")
        or generate_google_meet_link(doctor)
    ) if apt_type == "video" else None

    new_apt = {
        "_id": str(ObjectId()),
        "patient": patient_id,
        "doctor": doctor_obj_id,
        "date": date_str,
        "timeSlot": time_slot,
        "type": apt_type,
        "status": "scheduled",
        "symptoms": symptoms if isinstance(symptoms, list) else [symptoms],
        "notes": notes,
        "meetLink": meet_link,
        "createdAt": datetime.utcnow().isoformat()
    }
    await appointments_col.insert_one(new_apt)

    # Trigger email notifications to both Doctor and Patient
    patient_email = patient.get("email")
    patient_uid = str(patient.get("user") or patient.get("_id", ""))
    patient_user = await users_col.find_one({"_id": patient_uid}) or {}
    if not patient_email:
        patient_email = patient_user.get("email")

    doctor_email = doctor.get("email")
    doc_uid = str(doctor.get("user") or doctor.get("_id", ""))
    doctor_user = await users_col.find_one({"_id": doc_uid}) or {}
    if not doctor_email:
        doctor_email = doctor_user.get("email")

    apt_details = {
        "doctorName": doctor.get("name", "Doctor"),
        "patientName": patient.get("name", "Patient"),
        "date": date_str,
        "timeSlot": time_slot,
        "type": apt_type,
        "meetLink": meet_link
    }

    if patient_email:
        await send_appointment_email(
            patient_email,
            "Appointment Confirmation - MedChain Healthcare",
            apt_details,
            is_doctor=False
        )

    if doctor_email:
        await send_appointment_email(
            doctor_email,
            f"New Patient Consultation - {patient.get('name', 'Patient')}",
            apt_details,
            is_doctor=True
        )

    return new_apt

@router.get("/doctors/{doctor_id}/slots")
async def get_appointment_slots(doctor_id: str, date: str = Query(...)):
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

    available_slots = [s for s in slots if s.get("startTime") not in booked_times]
    return {"slots": available_slots}

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointments_col = db_manager.get_collection("appointments")
    await appointments_col.update_one(
        {"_id": appointment_id},
        {"$set": {"status": "cancelled"}}
    )
    return {"message": "Appointment cancelled successfully"}

@router.put("/{appointment_id}/meet-link")
async def update_appointment_meet_link(
    appointment_id: str,
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    meet_link = body.get("meetLink", "").strip()
    if not meet_link:
        raise HTTPException(status_code=400, detail="meetLink cannot be empty")

    if not meet_link.startswith("http://") and not meet_link.startswith("https://"):
        meet_link = f"https://{meet_link}"

    appointments_col = db_manager.get_collection("appointments")
    apt = await appointments_col.find_one({"_id": appointment_id})
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    await appointments_col.update_one(
        {"_id": appointment_id},
        {"$set": {"meetLink": meet_link}}
    )
    return {"message": "Meeting link updated successfully", "meetLink": meet_link}

@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    appointments_col = db_manager.get_collection("appointments")
    new_status = body.get("status", "scheduled")
    await appointments_col.update_one(
        {"_id": appointment_id},
        {"$set": {"status": new_status}}
    )
    return {"message": f"Appointment status updated to {new_status}"}

@router.get("/stats")
async def get_appointment_stats(current_user: dict = Depends(get_current_user)):
    appointments_col = db_manager.get_collection("appointments")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    user_id = current_user["userId"]
    role = current_user.get("role")

    if role == "doctor":
        doctor = await doctors_col.find_one({"user": user_id}) or {}
        doc_id = str(doctor.get("_id", ""))
        apts = await appointments_col.find({"$or": [{"doctor": user_id}, {"doctor": doc_id}]}).to_list()
    elif role == "patient":
        patient = await patients_col.find_one({"user": user_id}) or {}
        p_id = str(patient.get("_id", ""))
        apts = await appointments_col.find({"$or": [{"patient": user_id}, {"patient": p_id}]}).to_list()
    else:
        apts = await appointments_col.find({}).to_list()

    return {
        "total": len(apts),
        "upcoming": sum(1 for a in apts if a.get("status") == "scheduled"),
        "completed": sum(1 for a in apts if a.get("status") == "completed")
    }

