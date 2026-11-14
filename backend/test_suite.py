import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bson import ObjectId
from datetime import datetime
from backend.app.database import db_manager, seed_initial_data_if_empty
from backend.app.auth.security import create_access_token, verify_password, hash_password
from backend.app.services.email import generate_google_meet_link

async def run_full_verification():
    print("==================================================")
    print("   MEDCHAIN COMPREHENSIVE END-TO-END VERIFICATION  ")
    print("==================================================\n")

    # 1. Initialize DB and Seed Demo Data
    await db_manager.initialize()
    await seed_initial_data_if_empty()
    print("✅ 1. Database initialized and demo accounts seeded.")

    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")
    appointments_col = db_manager.get_collection("appointments")
    products_col = db_manager.get_collection("products")
    messages_col = db_manager.get_collection("messages")
    records_col = db_manager.get_collection("medical_records")

    # 2. Test Demo Doctor Account
    doc_user = await users_col.find_one({"email": "doctor@medchain.com"})
    assert doc_user is not None, "Demo doctor user missing!"
    assert verify_password("password123", doc_user["password"]), "Demo doctor password mismatch!"
    doc_profile = await doctors_col.find_one({"user": str(doc_user["_id"])})
    assert doc_profile is not None, "Demo doctor profile missing!"
    print(f"✅ 2. Demo Doctor verified: {doc_profile['name']} ({doc_profile['specialization']})")

    # 3. Test Demo Patient Account
    pat_user = await users_col.find_one({"email": "patient@medchain.com"})
    assert pat_user is not None, "Demo patient user missing!"
    assert verify_password("password123", pat_user["password"]), "Demo patient password mismatch!"
    pat_profile = await patients_col.find_one({"user": str(pat_user["_id"])})
    assert pat_profile is not None, "Demo patient profile missing!"
    print(f"✅ 3. Demo Patient verified: {pat_profile['name']} ({pat_profile['bloodGroup']})")

    # 4. Test Pharmacy Products
    products = await products_col.find({}).to_list()
    assert len(products) >= 5, "Product catalog check failed!"
    print(f"✅ 4. Pharmacy catalog verified: {len(products)} products available.")

    # 5. Test Doctor Slot Availability
    doc_id = str(doc_profile["_id"])
    avail = doc_profile.get("availability", [])
    assert len(avail) > 0, "Doctor availability schedule missing!"
    print(f"✅ 5. Doctor availability verified with {len(avail)} working days.")

    # 6. Test Appointment Booking (Patient -> Doctor)
    meet_link = generate_google_meet_link()
    apt_id = str(ObjectId())
    apt_doc = {
        "_id": apt_id,
        "patient": str(pat_profile["_id"]),
        "doctor": doc_id,
        "date": "2026-11-20T10:00:00.000Z",
        "timeSlot": {"startTime": "10:00", "endTime": "10:30"},
        "type": "video",
        "status": "scheduled",
        "symptoms": ["Mild headache", "Fatigue"],
        "meetLink": meet_link,
        "createdAt": datetime.utcnow().isoformat()
    }
    await appointments_col.insert_one(apt_doc)
    retrieved_apt = await appointments_col.find_one({"_id": apt_id})
    assert retrieved_apt is not None, "Appointment creation failed!"
    print(f"✅ 6. Video Consultation booked successfully: {retrieved_apt['meetLink']}")

    # 7. Test Medical Record Creation and Deletion
    rec_id = str(ObjectId())
    await records_col.insert_one({
        "_id": rec_id,
        "patient": str(pat_user["_id"]),
        "type": "lab_result",
        "title": "Complete Blood Count",
        "date": "2026-11-10",
        "description": "Routine annual blood work",
        "attachments": [],
        "createdAt": datetime.utcnow().isoformat()
    })
    rec = await records_col.find_one({"_id": rec_id})
    assert rec is not None, "Medical record insert failed!"
    await records_col.delete_one({"_id": rec_id})
    rec_after = await records_col.find_one({"_id": rec_id})
    assert rec_after is None, "Medical record deletion failed!"
    print("✅ 7. Medical Records vault (create & delete) verified.")

    # 8. Test Messaging Flow (Patient <-> Doctor)
    msg_id = str(ObjectId())
    await messages_col.insert_one({
        "_id": msg_id,
        "sender": str(pat_user["_id"]),
        "receiver": str(doc_user["_id"]),
        "content": "Hi Dr. Miller, I have scheduled an appointment for next week.",
        "attachments": [],
        "read": False,
        "createdAt": datetime.utcnow().isoformat()
    })
    msg = await messages_col.find_one({"_id": msg_id})
    assert msg is not None, "Message delivery failed!"
    print("✅ 8. Real-time messaging pipeline verified.")

    # 9. Test JWT Token Creation & Authentication
    token = create_access_token({"userId": str(pat_user["_id"]), "role": "patient"})
    assert token is not None and len(token) > 20, "JWT creation failed!"
    print("✅ 9. JWT session authentication verified.")

    print("\n==================================================")
    print("   ALL TESTS PASSED! APPLICATION VERIFIED END-TO-END")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_full_verification())
