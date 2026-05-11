from pydantic import BaseModel

class PurposeBase(BaseModel):
    text: str

class PurposeCreate(PurposeBase):
    pass

class PurposeResponse(PurposeBase):
    id: int

    class Config:
        from_attributes = True