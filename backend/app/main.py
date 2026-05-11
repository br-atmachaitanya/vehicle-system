from fastapi import FastAPI
from .database import Base, engine
import app.models # triggers all model imports

from app.routers import (
    institution, vehicles, accounts, credit_accounts,
    users, drivers, fixed_rates, purposes, trips, vehicle_expenses
)

app = FastAPI(title="Vehicle System", version="1.0.0")

# Create all tables on startup if they don't exist
Base.metadata.create_all(bind=engine)

# Register all routers
app.include_router(institution.router)
app.include_router(vehicles.router)
app.include_router(accounts.router)
app.include_router(credit_accounts.router)
app.include_router(users.router)
app.include_router(drivers.router)
app.include_router(fixed_rates.router)
app.include_router(purposes.router)
app.include_router(trips.router)
app.include_router(vehicle_expenses.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Vehicle System is running smoothly!"}