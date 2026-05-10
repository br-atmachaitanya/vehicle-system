from sqlalchemy import Column, String, Integer, Numeric, Date, Boolean
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(4), unique=True, nullable=False, index=True)
    description = Column(String(30), nullable=False)
    registration_number = Column(String(15))
    vehicle_type = Column(String(1), default='P')  # P=Private/Car
    rate_per_km = Column(Numeric(6, 2), default=0)
    credit_account_code = Column(String(2))        # FK to credit_accounts
    active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    # Compliance certificate dates
    road_tax_expiry = Column(Date)
    insurance_expiry = Column(Date)
    fitness_cert_expiry = Column(Date)
    permit_expiry = Column(Date)
    puc_expiry = Column(Date)
    vs_toll_tax_expiry = Column(Date)
    howrah_stn_expiry = Column(Date)
    sealdah_stn_expiry = Column(Date)