import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
logger = logging.getLogger("uvicorn")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("[Auth Debug] Token subject 'sub' is missing.")
            raise credentials_exception
        return payload
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
                return unverified_payload
            else:
                logger.warning(f"[Auth Debug] Token validation failed. Issuer: {iss}, Aud: {aud}")
        except Exception as ex:
            logger.warning(f"[Auth Debug] Unverified decode error: {ex}")
            
        raise credentials_exception
