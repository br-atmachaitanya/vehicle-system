from sqlalchemy import Column, String, Integer, Numeric
from app.database import Base

class FixedRate(Base):
    __tablename__ = "fixed_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(4), unique=True, nullable=False)
    description = Column(String(30), nullable=False)
    fixed_amount = Column(Numeric(7, 2), nullable=False)
    distance_threshold_km = Column(Integer, nullable=False)
    display_order = Column(Integer, default=0)