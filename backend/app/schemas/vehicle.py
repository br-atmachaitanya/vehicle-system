from pydantic import BaseModel
from typing import Optional
from datetime import date

class VehicleBase(BaseModel):
    code: str
    description: str
    registration_number: Optional[str] = None
    vehicle_type: str = 'P'
    rate_per_km: float = 0
    credit_account_code: Optional[str] = None
    active: bool = True
    display_order: int = 0
    road_tax_expiry: Optional[date] = None
    insurance_expiry: Optional[date] = None
    fitness_cert_expiry: Optional[date] = None
    permit_expiry: Optional[date] = None
    puc_expiry: Optional[date] = None
    vs_toll_tax_expiry: Optional[date] = None
    howrah_stn_expiry: Optional[date] = None
    sealdah_stn_expiry: Optional[date] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True