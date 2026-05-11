from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    code: str
    formal_name: str
    common_name: Optional[str] = None
    rate_per_km: float = 0
    is_independent_centre: bool = False
    preferred_credit_code: Optional[str] = None
    display_order: int = 0

class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True