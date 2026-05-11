from pydantic import BaseModel
from typing import Optional

class AccountBase(BaseModel):
    code: str
    name: str
    rate_per_km: float = 0
    is_independent_centre: bool = False
    preferred_credit_code: Optional[str] = None
    display_order: int = 0

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    pass

class AccountResponse(AccountBase):
    id: int

    class Config:
        from_attributes = True
        
