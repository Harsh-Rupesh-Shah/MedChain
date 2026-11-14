import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends
from bson import ObjectId
from backend.app.config import JWT_SECRET, ADMIN_EMAIL
from backend.app.database import db_manager

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not valid"
        )

async def get_current_user(request: Request) -> dict:
    # Look for x-auth-token first (used by React Axios interceptor), then fallback to Authorization: Bearer
    # Disallow passing sensitive authentication tokens in URL query parameters
    token = request.headers.get("x-auth-token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token, authorization denied"
        )

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not valid"
        )

    role = payload.get("role")
    user_id = payload.get("userId")
    email = payload.get("email")

    # Handle admin: verify identity against trusted server records
    if role == "admin":
        users_col = db_manager.get_collection("users")
        db_admin = await users_col.find_one({"email": email, "role": "admin"})
        if not db_admin and email != ADMIN_EMAIL:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin token verification failed: untrusted admin identity"
            )
        admin_id = str(db_admin["_id"]) if db_admin else (user_id or f"admin-{email.encode('utf-8').hex()}")
        return {
            "userId": admin_id,
            "role": "admin",
            "email": email,
            "_id": admin_id,
            "isVerified": True,
            "verificationStatus": "approved"
        }

    # For regular users, verify in database
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"_id": user_id})
    if not user:
        try:
            user = await users_col.find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return {
        "userId": str(user["_id"]),
        "role": user.get("role", "patient"),
        "email": user.get("email"),
        "_id": str(user["_id"]),
        "isVerified": user.get("isVerified", False),
        "verificationStatus": user.get("verificationStatus", "approved" if user.get("role") == "patient" else "pending")
    }

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        return current_user
    return role_checker

async def require_verified_doctor(current_user: dict = Depends(require_role(["doctor"]))):
    """Enforce that the requesting doctor has been verified and approved by an administrator."""
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"_id": current_user["userId"]})
    if not user:
        try:
            user = await users_col.find_one({"_id": ObjectId(current_user["userId"])})
        except Exception:
            pass

    if not user or not user.get("isVerified") or user.get("verificationStatus") != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor account pending verification or not approved"
        )
    return current_user

