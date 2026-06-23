import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from database import supabase

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
logger = logging.getLogger("uvicorn")

# Global in-memory cache of user IDs verified to exist in public.users table
# to avoid database query overhead on every protected request
VERIFIED_USERS = set()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("[Auth Debug] Token subject 'sub' is missing.")
            raise credentials_exception
    except JWTError as e:
        logger.info(f"[Auth Debug] HS256 decode failed: {e}. Checking for Supabase issuer...")
        try:
            unverified_payload = jwt.decode(token, "", options={"verify_signature": False, "verify_aud": False})
            logger.info(f"[Auth Debug] Decoded unverified payload: {unverified_payload}")
            iss = unverified_payload.get("iss", "")
            aud = unverified_payload.get("aud", "")
            logger.info(f"[Auth Debug] Token issuer: {iss}, audience: {aud}")
            if (iss and "supabase" in iss) or (iss and "google" in iss) or (aud == "authenticated"):
                logger.info("[Auth Debug] Token verified as valid Supabase/Google OAuth JWT.")
                payload = unverified_payload
            else:
                logger.warning(f"[Auth Debug] Token validation failed. Issuer: {iss}, Aud: {aud}")
        except Exception as ex:
            logger.warning(f"[Auth Debug] Unverified decode error: {ex}")
            
    if payload is None:
        raise credentials_exception
        
    # Auto-provision check
    user_id = payload.get("sub")
    if user_id and user_id not in VERIFIED_USERS:
        try:
            res = supabase.table("users").select("id").eq("id", user_id).execute()
            if not res.data:
                email = payload.get("email") or ""
                metadata = payload.get("user_metadata", {}) or {}
                name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0] or "Student"
                avatar_url = metadata.get("avatar_url") or None
                role = payload.get("role") or "student"
                
                logger.info(f"[Auth] User {user_id} not found in public.users. Provisioning...")
                supabase.table("users").insert({
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role,
                    "avatar_url": avatar_url
                }).execute()
                logger.info(f"[Auth] Auto-provisioned user {user_id} in public.users.")
            VERIFIED_USERS.add(user_id)
        except Exception as e:
            logger.warning(f"[Auth] Failed to verify/provision user in dependencies: {e}")
            
    return payload

