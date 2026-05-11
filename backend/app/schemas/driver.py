from pydantic import BaseModel
from typing import Optional

class DriverBase(BaseModel):
    code: str
    name: str
    display_order: int = 0

class DriverCreate(DriverBase):
    pass

class DriverUpdate(DriverBase):
    pass

class DriverResponse(DriverBase):
    id: int

    class Config:
        from_attributes = True