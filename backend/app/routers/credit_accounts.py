from app.services.auth import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.credit_account import CreditAccount
from app.schemas.credit_account import CreditAccountCreate, CreditAccountUpdate, CreditAccountResponse

router = APIRouter(prefix="/api/credit-accounts", tags=["Credit Accounts"])

@router.get("/", response_model=List[CreditAccountResponse])
def list_credit_accounts(db: Session = Depends(get_db)):
    return db.query(CreditAccount).order_by(CreditAccount.display_order).all()

@router.get("/{code}", response_model=CreditAccountResponse)
def get_credit_account(code: str, db: Session = Depends(get_db)):
    ca = db.query(CreditAccount).filter(CreditAccount.code == code).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Credit account not found")
    return ca

@router.post("/", response_model=CreditAccountResponse, status_code=201, dependencies=[Depends(require_admin)])
def create_credit_account(data: CreditAccountCreate, db: Session = Depends(get_db)):
    existing = db.query(CreditAccount).filter(CreditAccount.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Credit account code already exists")
    ca = CreditAccount(**data.model_dump())
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return ca

@router.put("/{code}", response_model=CreditAccountResponse, dependencies=[Depends(require_admin)])
def update_credit_account(code: str, data: CreditAccountUpdate, db: Session = Depends(get_db)):
    ca = db.query(CreditAccount).filter(CreditAccount.code == code).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Credit account not found")
    for key, value in data.model_dump().items():
        setattr(ca, key, value)
    db.commit()
    db.refresh(ca)
    return ca

@router.delete("/{code}", status_code=204, dependencies=[Depends(require_admin)])
def delete_credit_account(code: str, db: Session = Depends(get_db)):
    ca = db.query(CreditAccount).filter(CreditAccount.code == code).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Credit account not found")
    db.delete(ca)
    db.commit()