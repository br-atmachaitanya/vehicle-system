from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.system_user import SystemUser
from app.services.auth import (
    hash_password, verify_password, create_token,
    get_current_user, require_admin
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool
    username: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CreateUserRequest(BaseModel):
    username: str
    password: str
    is_admin: bool = False

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = db.query(SystemUser).filter(
        SystemUser.username == data.username
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    token = create_token(user.id, user.username, user.is_admin)
    return TokenResponse(
        access_token=token,
        is_admin=user.is_admin,
        username=user.username
    )

@router.get("/me")
def get_me(current_user: SystemUser = Depends(get_current_user)):
    """Return current logged-in user info."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin,
    }

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: SystemUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/users", dependencies=[Depends(require_admin)])
def create_system_user(data: CreateUserRequest, db: Session = Depends(get_db)):
    """Admin only: create a new system user."""
    existing = db.query(SystemUser).filter(
        SystemUser.username == data.username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = SystemUser(
        username=data.username,
        password_hash=hash_password(data.password),
        is_admin=data.is_admin,
    )
    db.add(user)
    db.commit()
    return {"message": f"User '{data.username}' created"}