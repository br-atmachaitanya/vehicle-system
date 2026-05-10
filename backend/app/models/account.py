from sqlalchemy import Column, String, Integer, Numeric, Boolean
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(4), unique=True, nullable=False, index=True)
    name = Column(String(30), nullable=False)
    rate_per_km = Column(Numeric(4, 2), default=0)
    is_independent_centre = Column(Boolean, default=False)
    preferred_credit_code = Column(String(2))
    display_order = Column(Integer, default=0)