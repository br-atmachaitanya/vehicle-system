from pydantic import BaseModel
from typing import Optional

class CreditAccountBase(BaseModel):
    code: str
    name: str
    linked_account_code: Optional[str] = None
    display_order: int = 0

class CreditAccountCreate(CreditAccountBase):
    pass

class CreditAccountUpdate(CreditAccountBase):
    pass

class CreditAccountResponse(CreditAccountBase):
    id: int

    class Config:
        from_attributes = True