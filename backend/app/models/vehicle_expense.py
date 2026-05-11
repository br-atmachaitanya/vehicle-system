from sqlalchemy import Column, String, Integer, Numeric, Date, Text
from app.database import Base

class VehicleExpense(Base):
    __tablename__ = "vehicle_expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, index=True)
    date = Column(Date, nullable=False)
    vehicle_code = Column(String(4), nullable=False, index=True)
    fuel_quantity = Column(Numeric(6, 2), default=0)
    fuel_rate = Column(Numeric(5, 2), default=0)
    fuel_total = Column(Numeric(8, 2), default=0)
    repair_charge = Column(Numeric(8, 2), default=0)
    misc_charge = Column(Numeric(8, 2), default=0)
    details = Column(Text)
    remarks = Column(Text)
    entry_sequence = Column(Integer, default=0)