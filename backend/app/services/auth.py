from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt                          # direct import, no passlib
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.system_user import SystemUser

SECRET_KEY = "vehicle-system-secret-change-in-production"
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 12

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(plain: str) -> str:
    """Hash a plain text password using bcrypt."""
    # encode() converts string to bytes — bcrypt requires bytes
    # gensalt() generates a random salt — makes every hash unique
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Check plain password against stored bcrypt hash."""
    return bcrypt.checkpw(
        plain.encode('utf-8'),
        hashed.encode('utf-8')
    )

def create_token(user_id: int, username: str, is_admin: bool) -> str:
    """Create a signed JWT token containing user info."""
    payload = {
        "sub": str(user_id),
        "username": username,
        "is_admin": is_admin,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> SystemUser:
    """Dependency: validates token and returns current user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    payload = decode_token(credentials.credentials)
    user = db.query(SystemUser).filter(
        SystemUser.id == int(payload["sub"])
    ).first()
    if not user or not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    return user

def require_admin(
    current_user: SystemUser = Depends(get_current_user)
) -> SystemUser:
    """Dependency: requires admin role."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user