from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

# System users (who log into the app) — separate from vehicle users/passengers
class SystemUser(Base):
    __tablename__ = "system_users"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    username     = Column(String(30), unique=True, nullable=False, index=True)
    # Never store plain passwords — always store the hash
    password_hash = Column(String(128), nullable=False)
    is_admin     = Column(Boolean, default=False)
    active       = Column(Boolean, default=True)