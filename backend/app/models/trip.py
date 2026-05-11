from sqlalchemy import Column, String, Integer, Numeric, Date, Boolean
from app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, index=True)  # e.g. "2627"

    # Dates & times
    departure_date = Column(Date, nullable=False, index=True)
    arrival_date = Column(Date)
    departure_time = Column(Integer)   # stored as HHMM integer e.g. 1430
    arrival_time = Column(Integer)
    duration_minutes = Column(Integer)

    # Core references
    vehicle_code = Column(String(4), nullable=False, index=True)
    account_code = Column(String(4), nullable=False, index=True)
    driver_code = Column(String(5), index=True)
    credit_account_code = Column(String(2))

    # Passenger
    passenger_name = Column(String(30))
    name_from_master = Column(Boolean, default=True)  # False = free text

    # Purpose
    purpose = Column(String(35))
    purpose_extra = Column(String(35))

    # Odometer
    odometer_out = Column(Integer)
    odometer_in = Column(Integer)
    km_run = Column(Integer)

    # Charge calculation
    charge_method = Column(String(1), nullable=False)  # 'F'=fixed, 'K'=per-km
    fixed_rate_code = Column(String(4))
    fixed_rate_amount = Column(Numeric(8, 2), default=0)
    extra_km = Column(Integer, default=0)
    extra_km_billed = Column(Boolean, default=False)
    extra_km_charge = Column(Numeric(8, 2), default=0)
    override_amount = Column(Numeric(8, 2), default=0)
    total_charge = Column(Numeric(8, 2), default=0)