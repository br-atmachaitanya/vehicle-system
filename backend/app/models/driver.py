from sqlalchemy import Column, String, Integer
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(5), unique=True, nullable=False, index=True)
    name = Column(String(30), nullable=False)
    display_order = Column(Integer, default=0)