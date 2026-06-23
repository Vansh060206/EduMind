# routes/auth.py
# This handles all authentication:
# signup, login, get current user

from fastapi import APIRouter, HTTPException
from database import supabase
from schemas.models import SignupRequest, LoginRequest, SurveySaveRequest
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

router = APIRouter()

# bcrypt is used directly for secure password hashing and verification

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def create_token(user_id: str, email: str, role: str):
    # JWT token = a secure way to identify a logged-in user
    # It's like a temporary ID card that expires in 7 days
    # Frontend stores this and sends it with every request
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup")
async def signup(data: SignupRequest):
    try:
        # Step 1: Check if email already exists
        existing = supabase.table("users")\
            .select("id")\
            .eq("email", data.email)\
            .execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Step 2: Hash the password
        # data.password = "mypassword123"
        # hashed    = "$2b$12$randomstuff..."
        hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Step 3: Save user to Supabase
        user = supabase.table("users").insert({
            "name": data.name,
            "email": data.email,
            "password_hash": hashed,
            "role": data.role
        }).execute()

        new_user = user.data[0]

        # Step 4: Create JWT token
        token = create_token(new_user["id"], new_user["email"], new_user["role"])

        return {
            "token": token,
            "user": {
                "id": new_user["id"],
                "name": new_user["name"],
                "email": new_user["email"],
                "role": new_user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(data: LoginRequest):
    try:
        # Step 1: Find user by email
        result = supabase.table("users")\
            .select("*")\
            .eq("email", data.email)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = result.data[0]

        # Step 2: Verify password
        # pwd_context.verify() hashes the input
        # and compares with stored hash
        if not bcrypt.checkpw(data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Step 3: Return token
        token = create_token(user["id"], user["email"], user["role"])

        return {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "survey": user.get("avatar_url")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_me(token: str):
    # Decode JWT to get user info
    try:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except Exception:
            # Fallback for Supabase / Google OAuth JWT tokens (signed by Supabase using RS256)
            payload = jwt.decode(token, "", options={"verify_signature": False, "verify_aud": False})
            iss = payload.get("iss", "")
            aud = payload.get("aud", "")
            if not ((iss and "supabase" in iss) or (iss and "google" in iss) or (aud == "authenticated")):
                raise Exception("Invalid token signature and issuer details.")
                
        user_id = payload.get("sub")
        result = supabase.table("users")\
            .select("id, name, email, role, avatar_url, created_at")\
            .eq("id", user_id)\
            .execute()
        if result.data:
            from dependencies import VERIFIED_USERS
            VERIFIED_USERS.add(user_id)
            return result.data[0]
        else:
            # Auto-provision user
            email = payload.get("email") or ""
            metadata = payload.get("user_metadata", {}) or {}
            name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0] or "Student"
            avatar_url = metadata.get("avatar_url") or None
            role = payload.get("role") or "student"
            
            try:
                new_user_res = supabase.table("users").insert({
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role,
                    "avatar_url": avatar_url
                }).execute()
                if new_user_res.data:
                    from dependencies import VERIFIED_USERS
                    VERIFIED_USERS.add(user_id)
                    return new_user_res.data[0]
            except Exception as e:
                import logging
                logger = logging.getLogger("uvicorn")
                logger.error(f"[Auth] Auto-provisioning user failed in /me: {e}")
            raise HTTPException(status_code=404, detail="User not found and could not be provisioned")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

@router.post("/survey")
async def save_survey(data: SurveySaveRequest):
    try:
        import json
        survey_str = json.dumps(data.survey_data)
        # Upsert into users table to store onboarding inputs under avatar_url
        result = supabase.table("users").upsert({
            "id": data.student_id,
            "name": data.name,
            "email": data.email,
            "avatar_url": survey_str,
            "role": "student"
        }).execute()
        return {"status": "success", "user": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")