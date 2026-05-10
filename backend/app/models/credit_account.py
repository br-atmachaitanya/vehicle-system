from sqlalchemy import Column, String, Integer
from app.database import Base

class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(2), unique=True, nullable=False)
    name = Column(String(30), nullable=False)
    linked_account_code = Column(String(4))
    display_order = Column(Integer, default=0)