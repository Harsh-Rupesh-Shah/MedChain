import logging
import time
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from backend.app.database import db_manager, convert_object_ids
from backend.app.auth.security import get_current_user, require_role

logger = logging.getLogger("medchain.pharmacy")
router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])

@router.get("/products")
async def get_products(
    category: str = Query(None),
    search: str = Query(None)
):
    products_col = db_manager.get_collection("products")
    query = {}
    if category and category != "all":
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    products = await products_col.find(query).to_list()
    # If database has no products yet, return default catalog
    if not products:
        sample_products = [
            {
                "_id": str(ObjectId()),
                "name": "Paracetamol 500mg",
                "description": "Effective relief for fever, headaches, and minor aches and pains.",
                "category": "otc",
                "price": 5.99,
                "stock": 150,
                "requiresPrescription": False,
                "manufacturer": "HealthCare Pharma",
                "dosageForm": "Tablet",
                "strength": "500mg",
                "packSize": "20 Tablets",
                "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"
            },
            {
                "_id": str(ObjectId()),
                "name": "Amoxicillin 250mg",
                "description": "Broad-spectrum penicillin antibiotic for bacterial infections.",
                "category": "prescription",
                "price": 14.50,
                "stock": 75,
                "requiresPrescription": True,
                "manufacturer": "BioMed Labs",
                "dosageForm": "Capsule",
                "strength": "250mg",
                "packSize": "30 Capsules",
                "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"
            },
            {
                "_id": str(ObjectId()),
                "name": "Digital Upper-Arm Blood Pressure Monitor",
                "description": "Accurate upper arm blood pressure monitor with digital display and memory function.",
                "category": "equipment",
                "price": 49.99,
                "stock": 40,
                "requiresPrescription": False,
                "manufacturer": "Omron Health",
                "dosageForm": "Device",
                "strength": "Standard",
                "packSize": "1 Unit",
                "image": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300"
            },
            {
                "_id": str(ObjectId()),
                "name": "Liposomal Vitamin D3 + K2 Complex",
                "description": "High-potency immune and bone health support complex.",
                "category": "wellness",
                "price": 22.00,
                "stock": 110,
                "requiresPrescription": False,
                "manufacturer": "NutraLife Science",
                "dosageForm": "Softgel",
                "strength": "5000 IU",
                "packSize": "60 Softgels",
                "image": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300"
            },
            {
                "_id": str(ObjectId()),
                "name": "Hospital-Grade Sterile Trauma & First Aid Kit",
                "description": "Professional 120-piece emergency medical kit.",
                "category": "equipment",
                "price": 34.99,
                "stock": 65,
                "requiresPrescription": False,
                "manufacturer": "SafeCare Medical",
                "dosageForm": "Kit",
                "strength": "120 Pieces",
                "packSize": "1 Case",
                "image": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300"
            }
        ]
        return convert_object_ids(sample_products)

    return convert_object_ids(products)

@router.post("/check-prescription")
async def check_prescription(body: dict = Body(...)):
    product_ids = body.get("productIds", [])
    products_col = db_manager.get_collection("products")

    for pid in product_ids:
        query = {"$or": [{"_id": str(pid)}]}
        try:
            query["$or"].append({"_id": ObjectId(str(pid))})
        except Exception:
            pass
        prod = await products_col.find_one(query)
        if prod and prod.get("requiresPrescription"):
            return {"requiresPrescription": True, "productName": prod.get("name", "Prescription Item")}

    return {"requiresPrescription": False}

@router.post("/orders")
async def create_order(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    orders_col = db_manager.get_collection("orders")
    items = body.get("items", [])
    shipping_address = body.get("shippingAddress", "")
    total_amount = float(body.get("totalAmount", 0.0))

    new_order = {
        "_id": str(ObjectId()),
        "user": current_user["userId"],
        "items": items,
        "shippingAddress": shipping_address,
        "totalAmount": total_amount,
        "status": "processing",
        "createdAt": datetime.utcnow().isoformat(),
        "estimatedDelivery": "2-3 business days"
    }
    await orders_col.insert_one(new_order)
    return convert_object_ids(new_order)

@router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders_col = db_manager.get_collection("orders")
    orders = await orders_col.find({"user": current_user["userId"]}).sort("createdAt", -1).to_list()
    return convert_object_ids(orders)

@router.post("/refill/{prescription_id}")
async def request_prescription_refill(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    prescriptions_col = db_manager.get_collection("prescriptions")
    query = {"$or": [{"_id": str(prescription_id)}]}
    try:
        query["$or"].append({"_id": ObjectId(str(prescription_id))})
    except Exception:
        pass
    prescription = await prescriptions_col.find_one(query)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    await prescriptions_col.update_one(
        query,
        {"$set": {"refillRequested": True, "refillRequestDate": datetime.utcnow().isoformat()}}
    )
    return {"message": "Refill request submitted successfully"}

@router.get("/doctor/prescriptions")
async def get_doctor_prescriptions_alias(current_user: dict = Depends(require_role(["doctor"]))):
    doctors_col = db_manager.get_collection("doctors")
    prescriptions_col = db_manager.get_collection("prescriptions")
    patients_col = db_manager.get_collection("patients")

    doctor = await doctors_col.find_one({"user": current_user["userId"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doc_id = str(doctor["_id"])
    prescriptions = await prescriptions_col.find({"$or": [{"doctor": doc_id}, {"doctor": current_user["userId"]}]}).sort("date", -1).to_list()
    for p in prescriptions:
        patient = await patients_col.find_one({"$or": [{"_id": str(p.get("patient"))}, {"user": str(p.get("patient"))}]}) or {}
        p["patient"] = {"name": patient.get("name", "Patient")}
    return convert_object_ids(prescriptions)

@router.post("/doctor/prescriptions")
async def create_doctor_prescription_alias(
    body: dict = Body(...),
    current_user: dict = Depends(require_role(["doctor"]))
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

@router.get("/patient/prescriptions")
async def get_patient_prescriptions_alias(current_user: dict = Depends(require_role(["patient"]))):
    prescriptions_col = db_manager.get_collection("prescriptions")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    patient = await patients_col.find_one({"user": current_user["userId"]}) or {}
    p_id = str(patient.get("_id", ""))

    prescriptions = await prescriptions_col.find({
        "$or": [{"patient": current_user["userId"]}, {"patient": p_id}]
    }).sort("date", -1).to_list()

    for p in prescriptions:
        doc_id = str(p.get("doctor", ""))
        doc = await doctors_col.find_one({"$or": [{"_id": doc_id}, {"user": doc_id}]}) or {}
        p["doctor"] = {"name": doc.get("name", "Doctor"), "specialization": doc.get("specialization", "")}

    return convert_object_ids(prescriptions)

@router.get("/patient/medication-reminders")
async def get_patient_reminders_alias(current_user: dict = Depends(require_role(["patient"]))):
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

    return convert_object_ids(reminders)

@router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders_col = db_manager.get_collection("pharmacy_orders")
    orders = await orders_col.find({"user": current_user["userId"]}).sort("createdAt", -1).to_list()
    return convert_object_ids(orders)

@router.post("/orders")
async def create_order(body: dict, current_user: dict = Depends(get_current_user)):
    orders_col = db_manager.get_collection("pharmacy_orders")
    now = datetime.utcnow()
    new_order = {
        "_id": str(ObjectId()),
        "user": current_user["userId"],
        "items": body.get("items", []),
        "totalAmount": float(body.get("totalAmount", 0.0)),
        "shippingAddress": body.get("shippingAddress", "Primary Patient Address"),
        "status": "Dispatched",
        "trackingNumber": f"MEDX-{int(now.timestamp())}",
        "estimatedDelivery": "Tomorrow by 5:00 PM (Cold-Chain Verified)",
        "createdAt": now.isoformat()
    }
    await orders_col.insert_one(new_order)
    return {"status": "success", "order": convert_object_ids(new_order)}

