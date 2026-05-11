from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.vehicle_expense import VehicleExpense
from app.schemas.vehicle_expense import VehicleExpenseCreate, VehicleExpenseUpdate, VehicleExpenseResponse

router = APIRouter(prefix="/api/expenses", tags=["Vehicle Expenses"])

@router.get("/", response_model=List[VehicleExpenseResponse])
def list_expenses(
    fiscal_year: Optional[str] = None,
    vehicle_code: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VehicleExpense)
    if fiscal_year:
        query = query.filter(VehicleExpense.fiscal_year == fiscal_year)
    if vehicle_code:
        query = query.filter(VehicleExpense.vehicle_code == vehicle_code)
    if date_from:
        query = query.filter(VehicleExpense.date >= date_from)
    if date_to:
        query = query.filter(VehicleExpense.date <= date_to)
    return query.order_by(VehicleExpense.date).all()

@router.post("/", response_model=VehicleExpenseResponse, status_code=201)
def create_expense(data: VehicleExpenseCreate, db: Session = Depends(get_db)):
    expense = VehicleExpense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.put("/{expense_id}", response_model=VehicleExpenseResponse)
def update_expense(expense_id: int, data: VehicleExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(VehicleExpense).filter(VehicleExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in data.model_dump().items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(VehicleExpense).filter(VehicleExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()