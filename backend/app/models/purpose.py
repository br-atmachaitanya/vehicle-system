from sqlalchemy import Column, String, Integer
from app.database import Base

class Purpose(Base):
    __tablename__ = "purposes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(String(35), unique=True, nullable=False)