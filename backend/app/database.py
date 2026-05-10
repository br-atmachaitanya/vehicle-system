from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database file sits next to the executable (or in backend/ during dev)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL=f"sqlite:///{os.path.join(BASE_DIR, '../../vehicles.db')}"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency — used in every API route to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()