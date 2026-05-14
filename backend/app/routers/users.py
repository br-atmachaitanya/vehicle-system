from app.services.auth import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse


router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def list_users(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if search:
        query = query.filter(
            User.formal_name.ilike(f"%{search}%") |
            User.common_name.ilike(f"%{search}%")
        )
    return query.order_by(User.display_order).all()

@router.get("/{code}", response_model=UserResponse)
def get_user(code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.code == code).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse, status_code=201, dependencies=[Depends(require_admin)])
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="User code already exists")
    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{code}", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_user(code: str, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.code == code).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{code}", status_code=204, dependencies=[Depends(require_admin)])
def delete_user(code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.code == code).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()