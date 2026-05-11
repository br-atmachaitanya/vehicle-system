from pydantic import BaseModel
from typing import Optional
from datetime import date

class VehicleExpenseBase(BaseModel):
    fiscal_year: str
    date: date
    vehicle_code: str
    fuel_quantity: float = 0
    fuel_rate: float = 0
    fuel_total: float = 0
    repair_charge: float = 0
    misc_charge: float = 0
    details: Optional[str] = None
    remarks: Optional[str] = None
    entry_sequence: int = 0

class VehicleExpenseCreate(VehicleExpenseBase):
    pass

class VehicleExpenseUpdate(VehicleExpenseBase):
    pass

class VehicleExpenseResponse(VehicleExpenseBase):
    id: int

    class Config:
        from_attributes = True