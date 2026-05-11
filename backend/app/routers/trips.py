from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services.charge import calculate_trip_charge

router = APIRouter(prefix="/api/trips", tags=["Trips"])

@router.get("/", response_model=List[TripResponse])
def list_trips(
    fiscal_year: Optional[str] = None,
    vehicle_code: Optional[str] = None,
    account_code: Optional[str] = None,
    driver_code: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Trip)
    if fiscal_year:
        query = query.filter(Trip.fiscal_year == fiscal_year)
    if vehicle_code:
        query = query.filter(Trip.vehicle_code == vehicle_code)
    if account_code:
        query = query.filter(Trip.account_code == account_code)
    if driver_code:
        query = query.filter(Trip.driver_code == driver_code)
    if date_from:
        query = query.filter(Trip.departure_date >= date_from)
    if date_to:
        query = query.filter(Trip.departure_date <= date_to)
    return query.order_by(Trip.departure_date).all()

@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.post("/", response_model=TripResponse, status_code=201)
def create_trip(data: TripCreate, db: Session = Depends(get_db)):
    trip = Trip(**data.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, data: TripUpdate, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for key, value in data.model_dump().items():
        setattr(trip, key, value)
    db.commit()
    db.refresh(trip)
    return trip

@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()

# Special endpoint — calculate charge without saving
@router.post("/calculate-charge")
def calculate_charge(
    charge_method: str,
    km_run: int,
    fixed_amount: float = 0,
    distance_threshold: int = 0,
    rate_per_km: float = 0,
    override_amount: float = 0,
    bill_extra_km: bool = False,
    db: Session = Depends(get_db)
):
    inst = db.query(__import__('app.models.institution', fromlist=['Institution']).Institution).first()
    km_margin = inst.km_margin if inst else 0

    result = calculate_trip_charge(
        charge_method=charge_method,
        km_run=km_run,
        km_margin=km_margin,
        fixed_amount=fixed_amount,
        distance_threshold=distance_threshold,
        rate_per_km=rate_per_km,
        override_amount=override_amount,
        bill_extra_km=bill_extra_km,
    )
    return result