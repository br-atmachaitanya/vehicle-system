from pydantic import BaseModel

class FixedRateBase(BaseModel):
    code: str
    description: str
    fixed_amount: float
    distance_threshold_km: int
    display_order: int = 0

class FixedRateCreate(FixedRateBase):
    pass

class FixedRateUpdate(FixedRateBase):
    pass

class FixedRateResponse(FixedRateBase):
    id: int

    class Config:
        from_attributes = True