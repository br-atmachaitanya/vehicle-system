from sqlalchemy import Column, Integer, String, Text
from app.database import Base
class Institution(Base):
    __tablename__ = "institutions"


    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(40), nullable=False)
    address = Column(String(25))
    city = Column(String(20))
    pin_code = Column(String(6))
    phone = Column(String(15))
    fax = Column(String(15))
    fiscal_year_start = Column(String(4), nullable=False)  # e.g. "2026"
    fiscal_year_end = Column(String(4), nullable=False)    # e.g. "2027"
    km_margin = Column(Integer, default=0)
    frequent_destinations = Column(Text)

    