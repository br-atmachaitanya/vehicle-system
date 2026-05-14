"""
First-run setup endpoint.
Creates the initial admin user if no users exist.
Only works when the system_users table is empty.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.system_user import SystemUser
from app.services.auth import hash_password

router = APIRouter(prefix="/api/setup", tags=["Setup"])

class SetupRequest(BaseModel):
    admin_username: str
    admin_password: str

@router.post("/init")
def initialize(data: SetupRequest, db: Session = Depends(get_db)):
    """
    Create initial admin account.
    Only works if NO users exist — prevents abuse after setup.
    """
    count = db.query(SystemUser).count()
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail="System already initialized. Use /api/auth/users to add more users."
        )

    admin = SystemUser(
        username=data.admin_username,
        password_hash=hash_password(data.admin_password),
        is_admin=True,
        active=True,
    )
    db.add(admin)
    db.commit()
    return {"message": f"Admin user '{data.admin_username}' created. You can now log in."}

@router.get("/status")
def setup_status(db: Session = Depends(get_db)):
    """Check if system has been initialized."""
    count = db.query(SystemUser).count()
    return {"initialized": count > 0}