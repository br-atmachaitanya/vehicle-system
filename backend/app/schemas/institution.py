from pydantic import BaseModel
from typing import Optional

class InstitutionBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    pin_code: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    fiscal_year_start: str
    fiscal_year_end: str
    km_margin: int = 0
    frequent_destinations: Optional[str] = None

class InstitutionUpdate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: int

    class Config:
        from_attributes = True  # allows reading from SQLAlchemy model