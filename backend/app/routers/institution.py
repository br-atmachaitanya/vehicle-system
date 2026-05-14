from app.services.auth import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.institution import Institution
from app.schemas.institution import InstitutionResponse, InstitutionUpdate

router = APIRouter(prefix="/api/institution", tags=["Institution"])

@router.get("/", response_model=InstitutionResponse)
def get_institution(db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not configured")
    return inst

@router.post("/", response_model=InstitutionResponse, dependencies=[Depends(require_admin)])
def create_institution(data: InstitutionUpdate, db: Session = Depends(get_db)):
    existing = db.query(Institution).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institution already exists. Use PUT to update.")
    inst = Institution(**data.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst

@router.put("/", response_model=InstitutionResponse, dependencies=[Depends(require_admin)])
def update_institution(data: InstitutionUpdate, db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    for key, value in data.model_dump().items():
        setattr(inst, key, value)
    db.commit()
    db.refresh(inst)
    return inst