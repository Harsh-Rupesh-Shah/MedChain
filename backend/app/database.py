import os
import json
import asyncio
import logging
from bson import ObjectId
from datetime import datetime, date
from pathlib import Path
from backend.app.config import MONGODB_URI, BASE_DIR

logger = logging.getLogger("medchain.database")

# In-memory / JSON file fallback storage for resilience
DATA_FILE = BASE_DIR / "backend" / "data" / "local_db.json"

class JSONEncoderWithBSON(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def convert_object_ids(doc):
    """Recursively convert string IDs or BSON ObjectIds to string or clean formats."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [convert_object_ids(item) for item in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if k == "_id" and isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, (dict, list)):
                new_doc[k] = convert_object_ids(v)
            else:
                new_doc[k] = v
        return new_doc
    return doc

class AsyncLocalCursor:
    def __init__(self, items):
        self._items = items
        self._index = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for key, d in reversed(key_or_list):
                reverse = (d == -1)
                self._items.sort(key=lambda x: str(x.get(key, "")), reverse=reverse)
        elif isinstance(key_or_list, str):
            reverse = (direction == -1)
            self._items.sort(key=lambda x: str(x.get(key_or_list, "")), reverse=reverse)
        return self

    def skip(self, count):
        self._items = self._items[count:]
        return self

    def limit(self, count):
        self._items = self._items[:count]
        return self

    async def to_list(self, length=None):
        if length is not None:
            return [convert_object_ids(x) for x in self._items[:length]]
        return [convert_object_ids(x) for x in self._items]

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._items):
            item = self._items[self._index]
            self._index += 1
            return convert_object_ids(item)
        raise StopAsyncIteration

class LocalCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _matches(self, doc, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "_id":
                target_id = str(v)
                doc_id = str(doc.get("_id", ""))
                if target_id != doc_id:
                    return False
                continue

            if k == "$or":
                # At least one sub-clause must match
                if not any(self._matches(doc, sub_q) for sub_q in v):
                    return False
                continue

            if k == "$and":
                if not all(self._matches(doc, sub_q) for sub_q in v):
                    return False
                continue

            doc_val = doc.get(k)

            if isinstance(v, dict):
                # Operator support: $ne, $in, $gte, $lt, $lte, $gt, $regex
                for op, op_val in v.items():
                    if op == "$ne" and str(doc_val) == str(op_val):
                        return False
                    elif op == "$in":
                        op_strs = [str(x) for x in op_val]
                        if str(doc_val) not in op_strs:
                            return False
                    elif op == "$nin":
                        op_strs = [str(x) for x in op_val]
                        if str(doc_val) in op_strs:
                            return False
                    elif op == "$gte" and not (doc_val is not None and doc_val >= op_val):
                        return False
                    elif op == "$lte" and not (doc_val is not None and doc_val <= op_val):
                        return False
                    elif op == "$gt" and not (doc_val is not None and doc_val > op_val):
                        return False
                    elif op == "$lt" and not (doc_val is not None and doc_val < op_val):
                        return False
                    elif op == "$regex":
                        import re
                        pattern = re.compile(op_val, re.IGNORECASE)
                        if not pattern.search(str(doc_val or "")):
                            return False
            else:
                if str(doc_val) != str(v) and doc_val != v:
                    return False
        return True

    async def find_one(self, query=None):
        query = query or {}
        data = self.db._get_data(self.name)
        for doc in data:
            if self._matches(doc, query):
                return convert_object_ids(doc)
        return None

    def find(self, query=None):
        query = query or {}
        data = self.db._get_data(self.name)
        matched = [doc for doc in data if self._matches(doc, query)]
        return AsyncLocalCursor(matched)

    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = str(ObjectId())
        elif isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        else:
            doc["_id"] = str(doc["_id"])

        if "createdAt" not in doc:
            doc["createdAt"] = datetime.utcnow().isoformat()

        data = self.db._get_data(self.name)
        data.append(doc)
        await self.db._save()
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def update_one(self, query, update, upsert=False):
        data = self.db._get_data(self.name)
        matched_doc = None
        for doc in data:
            if self._matches(doc, query):
                matched_doc = doc
                break

        if matched_doc:
            if "$set" in update:
                for k, v in update["$set"].items():
                    matched_doc[k] = v
            if "$push" in update:
                for k, v in update["$push"].items():
                    if k not in matched_doc or not isinstance(matched_doc[k], list):
                        matched_doc[k] = []
                    matched_doc[k].append(v)
            if "$pull" in update:
                for k, v in update["$pull"].items():
                    if k in matched_doc and isinstance(matched_doc[k], list):
                        matched_doc[k] = [x for x in matched_doc[k] if x != v]
            await self.db._save()
            return True

        if upsert:
            new_doc = dict(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            await self.insert_one(new_doc)
            return True
        return False

    async def update_many(self, query, update):
        data = self.db._get_data(self.name)
        count = 0
        for doc in data:
            if self._matches(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                count += 1
        if count > 0:
            await self.db._save()
        return count

    async def delete_one(self, query):
        data = self.db._get_data(self.name)
        for idx, doc in enumerate(data):
            if self._matches(doc, query):
                data.pop(idx)
                await self.db._save()
                return True
        return False

    async def delete_many(self, query):
        data = self.db._get_data(self.name)
        before = len(data)
        self.db._data[self.name] = [doc for doc in data if not self._matches(doc, query)]
        after = len(self.db._data[self.name])
        if before != after:
            await self.db._save()
        return before - after

    async def count_documents(self, query=None):
        query = query or {}
        data = self.db._get_data(self.name)
        return sum(1 for doc in data if self._matches(doc, query))

    async def aggregate(self, pipeline):
        # Specific lightweight aggregation support for project pipelines
        data = self.db._get_data(self.name)
        result = list(data)
        for stage in pipeline:
            if "$match" in stage:
                result = [doc for doc in result if self._matches(doc, stage["$match"])]
            elif "$lookup" in stage:
                from_col = stage["$lookup"]["from"]
                local_f = stage["$lookup"]["localField"]
                foreign_f = stage["$lookup"]["foreignField"]
                as_f = stage["$lookup"]["as"]
                foreign_data = self.db._get_data(from_col)
                for doc in result:
                    matches = [f for f in foreign_data if str(f.get(foreign_f)) == str(doc.get(local_f))]
                    doc[as_f] = matches
            elif "$unwind" in stage:
                path = stage["$unwind"] if isinstance(stage["$unwind"], str) else stage["$unwind"].get("path")
                preserve = False if isinstance(stage["$unwind"], str) else stage["$unwind"].get("preserveNullAndEmptyArrays", False)
                field = path.replace("$", "")
                unwound = []
                for doc in result:
                    items = doc.get(field, [])
                    if isinstance(items, list) and items:
                        for item in items:
                            new_d = dict(doc)
                            new_d[field] = item
                            unwound.append(new_d)
                    elif preserve:
                        new_d = dict(doc)
                        new_d[field] = None
                        unwound.append(new_d)
                result = unwound
            elif "$project" in stage:
                projected = []
                for doc in result:
                    p_doc = {}
                    for k, v in stage["$project"].items():
                        if v == 1:
                            p_doc[k] = doc.get(k)
                        elif isinstance(v, str) and v.startswith("$"):
                            # Simple dotted path
                            parts = v[1:].split(".")
                            curr = doc
                            for p in parts:
                                if isinstance(curr, dict):
                                    curr = curr.get(p)
                                else:
                                    curr = None
                            p_doc[k] = curr
                    projected.append(p_doc)
                result = projected
            elif "$sort" in stage:
                for k, d in reversed(list(stage["$sort"].items())):
                    result.sort(key=lambda x: str(x.get(k, "")), reverse=(d == -1))
            elif "$group" in stage:
                groups = {}
                for doc in result:
                    group_expr = stage["$group"]["_id"]
                    if isinstance(group_expr, dict) and "$cond" in group_expr:
                        cond = group_expr["$cond"]
                        # Evaluate basic $eq cond
                        eq = cond[0].get("$eq", [])
                        val1 = doc.get(eq[0].replace("$", "")) if isinstance(eq[0], str) else eq[0]
                        val2 = eq[1]
                        key = doc.get(cond[1].replace("$", "")) if val1 == val2 else doc.get(cond[2].replace("$", ""))
                    elif isinstance(group_expr, str) and group_expr.startswith("$"):
                        key = doc.get(group_expr[1:])
                    else:
                        key = str(group_expr)

                    if key not in groups:
                        groups[key] = {
                            "_id": key,
                            "lastMessage": doc
                        }
                result = list(groups.values())

        return AsyncLocalCursor(result)

class LocalDatabase:
    def __init__(self, filepath=DATA_FILE):
        self.filepath = Path(filepath)
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        self._data = {}
        self._load()

    def _load(self):
        if self.filepath.exists():
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception as e:
                logger.error(f"Error loading local db file: {e}")
                self._data = {}
        else:
            self._data = {}

    async def _save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, cls=JSONEncoderWithBSON)
        except Exception as e:
            logger.error(f"Error saving local db file: {e}")

    def _get_data(self, name):
        if name not in self._data:
            self._data[name] = []
        return self._data[name]

    def __getitem__(self, name):
        return LocalCollection(self, name)

# Database singleton
class DatabaseManager:
    def __init__(self):
        self.motor_client = None
        self.db = None
        self.is_motor = False
        self.local_db = LocalDatabase()

    async def initialize(self):
        # Configure custom DNS resolver if needed
        import dns.resolver
        try:
            dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
            dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1']
        except Exception:
            pass

        if MONGODB_URI:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                import certifi
                logger.info("Attempting connection to MongoDB Atlas...")

                # Use certifi CA bundle to resolve macOS Python SSL certificate verification
                ca_file = None
                try:
                    ca_file = certifi.where()
                except Exception:
                    pass

                motor_kwargs = {"serverSelectionTimeoutMS": 4000}
                if ca_file and os.path.exists(ca_file):
                    motor_kwargs["tlsCAFile"] = ca_file

                try:
                    client = AsyncIOMotorClient(MONGODB_URI, **motor_kwargs)
                    await client.admin.command('ping')
                except Exception as first_err:
                    err_str = str(first_err).lower()
                    if "certificate verify failed" in err_str or "ssl" in err_str:
                        logger.info("Retrying MongoDB Atlas connection with tlsAllowInvalidCertificates=True for macOS SSL compatibility...")
                        motor_kwargs["tlsAllowInvalidCertificates"] = True
                        client = AsyncIOMotorClient(MONGODB_URI, **motor_kwargs)
                        await client.admin.command('ping')
                    else:
                        raise first_err

                self.motor_client = client
                self.db = client.get_default_database()
                if self.db is None:
                    self.db = client["medchain"]
                self.is_motor = True
                logger.info("Connected to MongoDB Atlas successfully!")
                return
            except Exception as e:
                logger.warning(f"Could not connect to MongoDB Atlas ({e}). Operating in reliable local document store mode.")
        
        # Fallback to local storage
        self.db = self.local_db
        self.is_motor = False
        logger.info("Using embedded persistent document store for MedChain.")

    def get_collection(self, name: str):
        if self.is_motor and self.db is not None:
            return self.db[name]
        return self.local_db[name]

db_manager = DatabaseManager()

def get_db():
    return db_manager

# Seed sample data if database is fresh
async def seed_initial_data_if_empty():
    products_col = db_manager.get_collection("products")
    count = await products_col.count_documents({})
    if count == 0:
        sample_products = [
            {
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
                "name": "Digital Blood Pressure Monitor",
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
                "name": "Multivitamin & Zinc Formula",
                "description": "Daily immunity booster with essential vitamins A, C, D3, E and Zinc.",
                "category": "wellness",
                "price": 19.99,
                "stock": 100,
                "requiresPrescription": False,
                "manufacturer": "VitalLife Nutrition",
                "dosageForm": "Softgel",
                "strength": "Full Spectrum",
                "packSize": "60 Softgels",
                "image": "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=300"
            },
            {
                "name": "Metformin 500mg",
                "description": "Oral diabetes medicine for controlling blood sugar levels.",
                "category": "prescription",
                "price": 12.00,
                "stock": 90,
                "requiresPrescription": True,
                "manufacturer": "Glucosa Care",
                "dosageForm": "Tablet",
                "strength": "500mg",
                "packSize": "60 Tablets",
                "image": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300"
            }
        ]
        for p in sample_products:
            await products_col.insert_one(p)
        logger.info(f"Seeded {len(sample_products)} sample pharmacy products.")

    users_col = db_manager.get_collection("users")
    doctors_col = db_manager.get_collection("doctors")
    patients_col = db_manager.get_collection("patients")

    from backend.app.auth.security import hash_password

    # Seed demo doctor if not present
    existing_doc = await users_col.find_one({"email": "doctor@medchain.com"})
    if not existing_doc:
        doc_user_id = str(ObjectId())
        doc_profile_id = str(ObjectId())
        await doctors_col.insert_one({
            "_id": doc_profile_id,
            "user": doc_user_id,
            "name": "Dr. Sarah Miller",
            "specialization": "Cardiologist",
            "licenseNumber": "DOC-CARD-2024",
            "experience": 10,
            "consultationFee": 75.0,
            "phone": "+1 555-0199",
            "availability": [
                {
                    "day": d,
                    "slots": [
                        {"startTime": "09:00", "endTime": "09:30", "isBooked": False},
                        {"startTime": "09:30", "endTime": "10:00", "isBooked": False},
                        {"startTime": "10:00", "endTime": "10:30", "isBooked": False},
                        {"startTime": "10:30", "endTime": "11:00", "isBooked": False},
                        {"startTime": "14:00", "endTime": "14:30", "isBooked": False},
                        {"startTime": "14:30", "endTime": "15:00", "isBooked": False}
                    ]
                }
                for d in ["monday", "tuesday", "wednesday", "thursday", "friday"]
            ],
            "averageRating": 4.9
        })
        await users_col.insert_one({
            "_id": doc_user_id,
            "email": "doctor@medchain.com",
            "password": hash_password("password123"),
            "role": "doctor",
            "profile": doc_profile_id,
            "isVerified": True,
            "verificationStatus": "approved"
        })
        logger.info("Seeded demo doctor (doctor@medchain.com / password123).")

    # Seed demo patient if not present
    existing_pat = await users_col.find_one({"email": "patient@medchain.com"})
    if not existing_pat:
        pat_user_id = str(ObjectId())
        pat_profile_id = str(ObjectId())
        await patients_col.insert_one({
            "_id": pat_profile_id,
            "user": pat_user_id,
            "name": "John Doe",
            "phone": "+1 555-0144",
            "gender": "male",
            "bloodGroup": "O+",
            "allergies": ["Penicillin"],
            "chronicConditions": ["Hypertension"],
            "medicalHistory": [],
            "prescriptions": []
        })
        await users_col.insert_one({
            "_id": pat_user_id,
            "email": "patient@medchain.com",
            "password": hash_password("password123"),
            "role": "patient",
            "profile": pat_profile_id,
            "isVerified": True,
            "verificationStatus": "approved"
        })
        logger.info("Seeded demo patient (patient@medchain.com / password123).")


