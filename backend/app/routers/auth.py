import time
import os
import json
import logging
from pathlib import Path
from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status, Request
from pydantic import BaseModel

from backend.app.config import UPLOADS_DIR, BASE_DIR, ADMIN_EMAIL, ADMIN_PASSWORD
from backend.app.database import db_manager
from backend.app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
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

logger = logging.getLogger("medchain.auth")
router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/patient/register")
async def register_patient(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    phone: str = Form(None),
    address: str = Form(None),
    dateOfBirth: str = Form(None),
    gender: str = Form(None),
    bloodGroup: str = Form(None),
    allergies: str = Form(None),
    chronicConditions: str = Form(None),
    emergencyContactName: str = Form(None),
    emergencyContactPhone: str = Form(None),
    emergencyContactRelationship: str = Form(None),
    biometricData: UploadFile = File(None)
):
    users_col = db_manager.get_collection("users")
    patients_col = db_manager.get_collection("patients")

    # Check existing
    existing = await users_col.find_one({"email": email.strip().lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists with this email")

    user_id = str(ObjectId())
    patient_id = str(ObjectId())

    face_rel_path = None
    if biometricData and biometricData.filename:
        clean_name, content = await validate_and_read_upload(
            biometricData,
            allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
            allowed_mimes=ALLOWED_IMAGE_MIMES,
            max_size_bytes=MAX_IMAGE_SIZE,
            field_label="Biometric face image"
        )
        filename = f"{int(time.time()*1000)}-{clean_name}"
        dest_path = UPLOADS_DIR / "faces" / filename
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(content)
        face_rel_path = f"/uploads/faces/{filename}"

    # Parse JSON arrays if passed as string
    allergies_list = []
    if allergies:
        try:
            allergies_list = json.loads(allergies) if allergies.startswith("[") else [a.strip() for a in allergies.split(",") if a.strip()]
        except Exception:
            allergies_list = [allergies]

    chronic_list = []
    if chronicConditions:
        try:
            chronic_list = json.loads(chronicConditions) if chronicConditions.startswith("[") else [c.strip() for c in chronicConditions.split(",") if c.strip()]
        except Exception:
            chronic_list = [chronicConditions]

    new_patient = {
        "_id": patient_id,
        "user": user_id,
        "name": name,
        "phone": phone or "",
        "address": address or "",
        "dateOfBirth": dateOfBirth,
        "gender": gender,
        "bloodGroup": bloodGroup,
        "allergies": allergies_list,
        "chronicConditions": chronic_list,
        "emergencyContact": {
            "name": emergencyContactName or "",
            "phone": emergencyContactPhone or "",
            "relationship": emergencyContactRelationship or ""
        },
        "biometricData": {
            "image": face_rel_path
        } if face_rel_path else {},
        "medicalHistory": [],
        "prescriptions": [],
        "notificationSettings": {
            "email": True,
            "sms": True,
            "appointments": True,
            "reminders": True,
            "marketing": False
        }
    }
    await patients_col.insert_one(new_patient)

    new_user = {
        "_id": user_id,
        "email": email.strip().lower(),
        "password": hash_password(password),
        "role": "patient",
        "profile": patient_id,
        "isVerified": True,
        "verificationStatus": "approved"
    }
    await users_col.insert_one(new_user)

    return {
        "message": "Patient registered successfully",
        "user": {
            "email": new_user["email"],
            "name": name,
            "role": "patient"
        }
    }

@router.post("/doctor/register")
async def register_doctor(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    specialization: str = Form(...),
    licenseNumber: str = Form(...),
    experience: int = Form(1),
    consultationFee: float = Form(50.0),
    phone: str = Form(None),
    address: str = Form(None),
    city: str = Form(None),
    idCardImage: UploadFile = File(...)
):
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")

    existing = await users_col.find_one({"email": email.strip().lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists with this email")

    clean_name, content = await validate_and_read_upload(
        idCardImage,
        allowed_extensions=ALLOWED_RECORD_EXTENSIONS,
        allowed_mimes=ALLOWED_RECORD_MIMES,
        max_size_bytes=MAX_IMAGE_SIZE,
        field_label="Doctor ID card document"
    )
    filename = f"{int(time.time()*1000)}-{clean_name}"
    dest_path = UPLOADS_DIR / "doctor-ids" / filename
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(content)
    id_card_rel_path = f"/uploads/doctor-ids/{filename}"

    user_id = str(ObjectId())
    doctor_id = str(ObjectId())

    new_doctor = {
        "_id": doctor_id,
        "user": user_id,
        "name": name,
        "specialization": specialization,
        "licenseNumber": licenseNumber,
        "experience": experience,
        "consultationFee": consultationFee,
        "phone": phone or "",
        "idCardImage": id_card_rel_path,
        "location": {
            "address": address or "",
            "city": city or "",
            "state": "",
            "country": "India"
        },
        "availability": [
            {
                "day": day,
                "slots": [
                    {"startTime": "09:00", "endTime": "09:30", "isBooked": False},
                    {"startTime": "09:30", "endTime": "10:00", "isBooked": False},
                    {"startTime": "10:00", "endTime": "10:30", "isBooked": False},
                    {"startTime": "10:30", "endTime": "11:00", "isBooked": False},
                    {"startTime": "14:00", "endTime": "14:30", "isBooked": False},
                    {"startTime": "14:30", "endTime": "15:00", "isBooked": False},
                    {"startTime": "15:00", "endTime": "15:30", "isBooked": False}
                ]
            }
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]
        ],
        "ratings": [],
        "averageRating": 5.0
    }
    await doctors_col.insert_one(new_doctor)

    new_user = {
        "_id": user_id,
        "email": email.strip().lower(),
        "password": hash_password(password),
        "role": "doctor",
        "profile": doctor_id,
        "isVerified": False,
        "verificationStatus": "pending"
    }
    await users_col.insert_one(new_user)

    return {
        "message": "Doctor registration pending approval",
        "user": {
            "email": new_user["email"],
            "name": name,
            "role": "doctor",
            "verificationStatus": "pending"
        }
    }

# Generic registration endpoint to fix 404 from Register.tsx
@router.post("/register")
async def generic_register(
    request: Request,
    role: str = Form("patient"),
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    specialization: str = Form(None),
    licenseNumber: str = Form(None),
    experience: int = Form(1),
    phone: str = Form(None),
    address: str = Form(None),
    idCardImage: UploadFile = File(None),
    biometricData: UploadFile = File(None)
):
    if role == "doctor":
        if not idCardImage and not biometricData:
            raise HTTPException(status_code=400, detail="ID card image is required for doctor registration")
        upload_doc = idCardImage or biometricData
        return await register_doctor(
            request=request,
            email=email,
            password=password,
            name=name,
            specialization=specialization or "General Physician",
            licenseNumber=licenseNumber or "DOC12345",
            experience=experience,
            phone=phone,
            address=address,
            idCardImage=upload_doc
        )
    else:
        return await register_patient(
            request=request,
            email=email,
            password=password,
            name=name,
            phone=phone,
            address=address,
            biometricData=biometricData
        )

@router.post("/patient/login")
async def login_patient(req: LoginRequest):
    users_col = db_manager.get_collection("users")
    patients_col = db_manager.get_collection("patients")

    user = await users_col.find_one({"email": req.email.strip().lower(), "role": "patient"})
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    patient = await patients_col.find_one({"user": str(user["_id"])}) or {}
    token = create_access_token({"userId": str(user["_id"]), "role": "patient"})

    return {
        "token": token,
        "user": {
            "_id": str(user["_id"]),
            "email": user["email"],
            "role": "patient",
            "name": patient.get("name", "Patient")
        }
    }

@router.post("/doctor/login")
async def login_doctor(req: LoginRequest):
    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")

    user = await users_col.find_one({"email": req.email.strip().lower(), "role": "doctor"})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check verification status
    if not user.get("isVerified") or user.get("verificationStatus") != "approved":
        raise HTTPException(
            status_code=401,
            detail="Your account is pending approval. Please wait for admin verification."
        )

    if not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    doctor = await doctors_col.find_one({"user": str(user["_id"])}) or {}
    token = create_access_token({"userId": str(user["_id"]), "role": "doctor"})

    return {
        "token": token,
        "user": {
            "_id": str(user["_id"]),
            "email": user["email"],
            "role": "doctor",
            "name": doctor.get("name", "Doctor"),
            "specialization": doctor.get("specialization", "General Physician")
        }
    }

@router.post("/admin/login")
async def login_admin(req: LoginRequest):
    users_col = db_manager.get_collection("users")
    db_admin = await users_col.find_one({"email": req.email, "role": "admin"})

    valid = False
    if db_admin:
        valid = verify_password(req.password, db_admin.get("password", ""))
    elif req.email == ADMIN_EMAIL and req.password == ADMIN_PASSWORD:
        valid = True

    if not valid:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    admin_id = str(db_admin["_id"]) if db_admin else ("admin-" + req.email.encode("utf-8").hex())
    token = create_access_token({
        "userId": admin_id,
        "role": "admin",
        "email": req.email
    })

    return {
        "token": token,
        "user": {
            "_id": admin_id,
            "email": req.email,
            "role": "admin",
            "name": db_admin.get("name", "System Administrator") if db_admin else "System Administrator"
        }
    }

@router.post("/patient/face-login")
async def face_login(
    email: str = Form(...),
    face: UploadFile = File(...)
):
    users_col = db_manager.get_collection("users")
    patients_col = db_manager.get_collection("patients")

    user = await users_col.find_one({"email": email.strip().lower(), "role": "patient"})
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")

    user_id_str = str(user["_id"])
    patient = await patients_col.find_one({"user": user_id_str})
    if not patient:
        try:
            from bson import ObjectId
            patient = await patients_col.find_one({"user": ObjectId(user_id_str)})
        except Exception:
            pass

    if not patient or not patient.get("biometricData", {}).get("image"):
        raise HTTPException(status_code=404, detail="No face data found for this patient")

    # Validate and save uploaded face temporarily
    clean_name, content = await validate_and_read_upload(
        face,
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
        allowed_mimes=ALLOWED_IMAGE_MIMES,
        max_size_bytes=MAX_IMAGE_SIZE,
        field_label="Verification face image"
    )
    filename = f"{int(time.time()*1000)}-face-login.jpg"
    temp_uploaded_path = UPLOADS_DIR / "faces" / filename
    temp_uploaded_path.parent.mkdir(parents=True, exist_ok=True)
    with open(temp_uploaded_path, "wb") as f:
        f.write(content)

    stored_image_rel = patient["biometricData"]["image"].lstrip("/")
    # Check possible upload roots
    stored_path = BASE_DIR / stored_image_rel
    if not stored_path.exists():
        stored_path = BASE_DIR / "server" / stored_image_rel
    if not stored_path.exists():
        stored_path = UPLOADS_DIR / "faces" / Path(stored_image_rel).name

    match = await verify_face(str(temp_uploaded_path), str(stored_path))
    if not match:
        raise HTTPException(status_code=401, detail="Face recognition failed")

    token = create_access_token({"userId": str(user["_id"]), "role": "patient"})
    return {
        "token": token,
        "user": {
            "_id": str(user["_id"]),
            "email": user["email"],
            "role": "patient",
            "name": patient.get("name", "Patient")
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role == "admin":
        return {
            "_id": current_user["userId"],
            "email": current_user.get("email", ADMIN_EMAIL),
            "role": "admin",
            "name": "System Administrator"
        }

    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"_id": current_user["userId"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile_data = None
    name = "User"
    if role == "doctor":
        doctors_col = db_manager.get_collection("doctors")
        profile_data = await doctors_col.find_one({"user": str(user["_id"])})
        if profile_data:
            name = profile_data.get("name", "Doctor")
    elif role == "patient":
        patients_col = db_manager.get_collection("patients")
        profile_data = await patients_col.find_one({"user": str(user["_id"])})
        if profile_data:
            name = profile_data.get("name", "Patient")

    return {
        "_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": name,
        "profile": profile_data
    }
