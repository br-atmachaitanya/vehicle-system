from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.get("/", response_model=List[AccountResponse])
def list_accounts(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Account)
    if search:
        query = query.filter(Account.name.ilike(f"%{search}%"))
    return query.order_by(Account.display_order).all()

@router.get("/{code}", response_model=AccountResponse)
def get_account(code: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.code == code).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@router.post("/", response_model=AccountResponse, status_code=201,dependencies=[Depends(require_admin)])
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    existing = db.query(Account).filter(Account.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account code already exists")
    account = Account(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.put("/{code}", response_model=AccountResponse, dependencies=[Depends(require_admin)])
def update_account(code: str, data: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.code == code).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in data.model_dump().items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account

@router.delete("/{code}", status_code=204, dependencies=[Depends(require_admin)])
def delete_account(code: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.code == code).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()