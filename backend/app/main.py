from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models

from app.routers import (
    institution, vehicles, accounts, credit_accounts,
    users, drivers, fixed_rates, purposes, trips,
    vehicle_expenses, auth, setup , reports                  # added auth, setup
)

app = FastAPI(title="Vehicle Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)       # new
app.include_router(setup.router)      # new
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
app.include_router(reports.router)    # new

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Vehicle system is running"}