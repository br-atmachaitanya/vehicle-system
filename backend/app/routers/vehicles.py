from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Vehicle)
    if active_only:
        query = query.filter(Vehicle.active == True)
    return query.order_by(Vehicle.display_order).all()

@router.get("/{code}", response_model=VehicleResponse)
def get_vehicle(code: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.code == code).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle code already exists")
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{code}", response_model=VehicleResponse)
def update_vehicle(code: str, data: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.code == code).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in data.model_dump().items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{code}", status_code=204)
def delete_vehicle(code: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.code == code).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()