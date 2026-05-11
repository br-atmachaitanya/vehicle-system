from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.fixed_rate import FixedRate
from app.schemas.fixed_rate import FixedRateCreate, FixedRateUpdate, FixedRateResponse

router = APIRouter(prefix="/api/fixed-rates", tags=["Fixed Rates"])

@router.get("/", response_model=List[FixedRateResponse])
def list_fixed_rates(db: Session = Depends(get_db)):
    return db.query(FixedRate).order_by(FixedRate.display_order).all()

@router.get("/{code}", response_model=FixedRateResponse)
def get_fixed_rate(code: str, db: Session = Depends(get_db)):
    rate = db.query(FixedRate).filter(FixedRate.code == code).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Fixed rate not found")
    return rate

@router.post("/", response_model=FixedRateResponse, status_code=201)
def create_fixed_rate(data: FixedRateCreate, db: Session = Depends(get_db)):
    existing = db.query(FixedRate).filter(FixedRate.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fixed rate code already exists")
    rate = FixedRate(**data.model_dump())
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate

@router.put("/{code}", response_model=FixedRateResponse)
def update_fixed_rate(code: str, data: FixedRateUpdate, db: Session = Depends(get_db)):
    rate = db.query(FixedRate).filter(FixedRate.code == code).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Fixed rate not found")
    for key, value in data.model_dump().items():
        setattr(rate, key, value)
    db.commit()
    db.refresh(rate)
    return rate

@router.delete("/{code}", status_code=204)
def delete_fixed_rate(code: str, db: Session = Depends(get_db)):
    rate = db.query(FixedRate).filter(FixedRate.code == code).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Fixed rate not found")
    db.delete(rate)
    db.commit()