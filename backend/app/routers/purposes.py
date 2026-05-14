from app.services.auth import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.purpose import Purpose
from app.schemas.purpose import PurposeCreate, PurposeResponse

router = APIRouter(prefix="/api/purposes", tags=["Purposes"])

@router.get("/", response_model=List[PurposeResponse])
def list_purposes(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Purpose)
    if search:
        query = query.filter(Purpose.text.ilike(f"%{search}%"))
    return query.order_by(Purpose.text).all()

@router.post("/", response_model=PurposeResponse, status_code=201, dependencies=[Depends(require_admin)])
def create_purpose(data: PurposeCreate, db: Session = Depends(get_db)):
    existing = db.query(Purpose).filter(Purpose.text == data.text).first()
    if existing:
        raise HTTPException(status_code=400, detail="Purpose already exists")
    purpose = Purpose(**data.model_dump())
    db.add(purpose)
    db.commit()
    db.refresh(purpose)
    return purpose

@router.delete("/{purpose_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_purpose(purpose_id: int, db: Session = Depends(get_db)):
    purpose = db.query(Purpose).filter(Purpose.id == purpose_id).first()
    if not purpose:
        raise HTTPException(status_code=404, detail="Purpose not found")
    db.delete(purpose)
    db.commit()