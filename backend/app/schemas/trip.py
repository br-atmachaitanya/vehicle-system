from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import date

class TripBase(BaseModel):
    fiscal_year: str
    departure_date: date
    arrival_date: Optional[date] = None
    departure_time: Optional[int] = None
    arrival_time: Optional[int] = None
    duration_minutes: Optional[int] = None
    vehicle_code: str
    account_code: str
    driver_code: Optional[str] = None
    credit_account_code: Optional[str] = None
    passenger_name: Optional[str] = None
    name_from_master: bool = True
    purpose: Optional[str] = None
    purpose_extra: Optional[str] = None
    odometer_out: Optional[int] = None
    odometer_in: Optional[int] = None
    km_run: Optional[int] = None
    charge_method: str                      # 'F' or 'K' for fixed or per-km
    fixed_rate_code: Optional[str] = None
    fixed_rate_amount: float = 0
    extra_km: int = 0
    extra_km_billed: bool = False
    extra_km_charge: float = 0
    override_amount: float = 0
    total_charge: float = 0

class TripCreate(TripBase):
    @model_validator(mode='after')
    def validate_charge_method(self):
        if self.charge_method not in ('F', 'K'):
            raise ValueError("charge_method must be 'F' (fixed) or 'K' (per-km)")
        if self.charge_method == 'F' and not self.fixed_rate_code:
            raise ValueError("fixed_rate_code required when charge_method is 'F'")
        return self

class TripUpdate(TripBase):
    pass

class TripResponse(TripBase):
    id: int

    class Config:
        from_attributes = True