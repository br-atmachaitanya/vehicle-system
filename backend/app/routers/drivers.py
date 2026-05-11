from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])



@router.get("/", response_model=List[DriverResponse])
def list_drivers(db: Session = Depends(get_db)):
    return db.query(Driver).order_by(Driver.display_order).all()

@router.get("/{code}", response_model=DriverResponse)
def get_driver(code: str, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.code == code).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.post("/", response_model=DriverResponse, status_code=201)
def create_driver(data: DriverCreate, db: Session = Depends(get_db)):
    existing = db.query(Driver).filter(Driver.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Driver code already exists")
    driver = Driver(**data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver

@router.put("/{code}", response_model=DriverResponse)
def update_driver(code: str, data: DriverUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.code == code).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    for key, value in data.model_dump().items():
        setattr(driver, key, value)
    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/{code}", status_code=204)
def delete_driver(code: str, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.code == code).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(driver)
    db.commit()