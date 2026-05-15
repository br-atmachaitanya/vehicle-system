"""
Report data assembly functions.
Each function queries the database and returns structured data
that can be rendered as JSON (browser) or PDF (download).
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.account import Account
from app.models.credit_account import CreditAccount
from app.models.driver import Driver
from app.models.vehicle_expense import VehicleExpense
from app.models.institution import Institution


def get_institution_name(db: Session) -> str:
    """Helper — get institution name for report headers."""
    inst = db.query(Institution).first()
    return inst.name if inst else "Vehicle Department"


def report_account_bill(
    db: Session,
    date_from: date,
    date_to: date,
    account_code: Optional[str] = None,  # None = all accounts
) -> dict:
    """
    Account Bill (ACBL):
    Shows all trips charged to each account in the date range.
    Groups by account, subtotals per account, grand total.
    """
    query = db.query(Trip).filter(
        Trip.departure_date >= date_from,
        Trip.departure_date <= date_to,
    )
    if account_code:
        query = query.filter(Trip.account_code == account_code)

    trips = query.order_by(Trip.account_code, Trip.departure_date).all()

    # Get all account names in one query (avoid N+1 queries)
    account_codes = list({t.account_code for t in trips})
    accounts = {
        a.code: a.name
        for a in db.query(Account).filter(Account.code.in_(account_codes)).all()
    }

    # Get vehicle descriptions
    vehicle_codes = list({t.vehicle_code for t in trips})
    vehicles = {
        v.code: v.description
        for v in db.query(Vehicle).filter(Vehicle.code.in_(vehicle_codes)).all()
    }

    # Group trips by account
    grouped = {}
    for trip in trips:
        code = trip.account_code
        if code not in grouped:
            grouped[code] = {
                "account_code": code,
                "account_name": accounts.get(code, code),
                "trips": [],
                "subtotal": 0,
            }
        grouped[code]["trips"].append({
            "date": trip.departure_date.strftime("%d/%m/%Y"),
            "vehicle": vehicles.get(trip.vehicle_code, trip.vehicle_code),
            "passenger": trip.passenger_name or "—",
            "purpose": trip.purpose or "—",
            "km_run": trip.km_run or 0,
            "charge_method": trip.charge_method,
            "amount": float(trip.total_charge or 0),
        })
        grouped[code]["subtotal"] += float(trip.total_charge or 0)

    # Sort groups alphabetically by account name
    sorted_groups = sorted(grouped.values(), key=lambda g: g["account_name"])

    grand_total = sum(g["subtotal"] for g in sorted_groups)

    return {
        "report_type": "account_bill",
        "title": "Vehicle Bill",
        "institution": get_institution_name(db),
        "date_from": date_from.strftime("%d/%m/%Y"),
        "date_to": date_to.strftime("%d/%m/%Y"),
        "groups": sorted_groups,
        "grand_total": round(grand_total, 2),
    }


def report_credit_bill(
    db: Session,
    date_from: date,
    date_to: date,
    credit_code: str,
) -> dict:
    """
    Credit Bill (CRBL):
    Shows trips credited to one central account,
    broken down by debit account.
    """
    trips = db.query(Trip).filter(
        Trip.departure_date >= date_from,
        Trip.departure_date <= date_to,
        Trip.credit_account_code == credit_code,
    ).order_by(Trip.account_code, Trip.departure_date).all()

    # Get credit account name
    cr = db.query(CreditAccount).filter(CreditAccount.code == credit_code).first()
    credit_name = cr.name if cr else credit_code

    # Get account and vehicle names
    account_codes  = list({t.account_code  for t in trips})
    vehicle_codes  = list({t.vehicle_code  for t in trips})

    accounts = {
        a.code: a.name
        for a in db.query(Account).filter(Account.code.in_(account_codes)).all()
    }
    vehicles = {
        v.code: v.description
        for v in db.query(Vehicle).filter(Vehicle.code.in_(vehicle_codes)).all()
    }

    # Group by debit account
    grouped = {}
    for trip in trips:
        code = trip.account_code
        if code not in grouped:
            grouped[code] = {
                "account_code": code,
                "account_name": accounts.get(code, code),
                "trips": [],
                "subtotal": 0,
            }
        grouped[code]["trips"].append({
            "date":      trip.departure_date.strftime("%d/%m/%Y"),
            "vehicle":   vehicles.get(trip.vehicle_code, trip.vehicle_code),
            "passenger": trip.passenger_name or "—",
            "purpose":   trip.purpose or "—",
            "km_run":    trip.km_run or 0,
            "amount":    float(trip.total_charge or 0),
        })
        grouped[code]["subtotal"] += float(trip.total_charge or 0)

    sorted_groups = sorted(grouped.values(), key=lambda g: g["account_name"])
    grand_total   = sum(g["subtotal"] for g in sorted_groups)

    return {
        "report_type":   "credit_bill",
        "title":         "Credit Bill",
        "institution":   get_institution_name(db),
        "credit_name":   credit_name,
        "date_from":     date_from.strftime("%d/%m/%Y"),
        "date_to":       date_to.strftime("%d/%m/%Y"),
        "groups":        sorted_groups,
        "grand_total":   round(grand_total, 2),
    }


def report_log_book(
    db: Session,
    date_from: date,
    date_to: date,
    vehicle_code: str,
) -> dict:
    """
    Vehicle Log Book (LOGBK):
    All trips for one vehicle in date range.
    """
    trips = db.query(Trip).filter(
        Trip.departure_date >= date_from,
        Trip.departure_date <= date_to,
        Trip.vehicle_code == vehicle_code,
    ).order_by(Trip.departure_date).all()

    vehicle = db.query(Vehicle).filter(Vehicle.code == vehicle_code).first()

    # Get account names and driver names
    account_codes = list({t.account_code for t in trips if t.account_code})
    driver_codes  = list({t.driver_code  for t in trips if t.driver_code})

    accounts = {
        a.code: a.name
        for a in db.query(Account).filter(Account.code.in_(account_codes)).all()
    }
    drivers = {
        d.code: d.name
        for d in db.query(Driver).filter(Driver.code.in_(driver_codes)).all()
    }

    def fmt_time(t):
        """Convert HHMM integer to HH:MM string."""
        if not t:
            return "—"
        s = str(t).zfill(4)   # pad to 4 digits e.g. 900 → "0900"
        return f"{s[:2]}:{s[2:]}"

    rows = []
    total_km = 0
    for trip in trips:
        rows.append({
            "date":      trip.departure_date.strftime("%d/%m/%Y"),
            "passenger": trip.passenger_name or "—",
            "purpose":   trip.purpose or "—",
            "km_out":    trip.odometer_out or "—",
            "km_in":     trip.odometer_in or "—",
            "km_run":    trip.km_run or 0,
            "dep_time":  fmt_time(trip.departure_time),
            "arr_time":  fmt_time(trip.arrival_time),
            "account":   accounts.get(trip.account_code, trip.account_code or "—"),
            "driver":    drivers.get(trip.driver_code, trip.driver_code or "—"),
        })
        total_km += trip.km_run or 0

    return {
        "report_type":    "log_book",
        "title":          "Vehicle Log Book",
        "institution":    get_institution_name(db),
        "vehicle_code":   vehicle_code,
        "vehicle_name":   vehicle.description if vehicle else vehicle_code,
        "date_from":      date_from.strftime("%d/%m/%Y"),
        "date_to":        date_to.strftime("%d/%m/%Y"),
        "rows":           rows,
        "total_km":       total_km,
    }


def report_driver_log_book(
    db: Session,
    date_from: date,
    date_to: date,
    driver_code: str,
) -> dict:
    """
    Driver Log Book (DLOGBK):
    All trips driven by one driver in date range.
    """
    trips = db.query(Trip).filter(
        Trip.departure_date >= date_from,
        Trip.departure_date <= date_to,
        Trip.driver_code == driver_code,
    ).order_by(Trip.departure_date).all()

    driver  = db.query(Driver).filter(Driver.code == driver_code).first()

    vehicle_codes = list({t.vehicle_code for t in trips if t.vehicle_code})
    vehicles = {
        v.code: v.description
        for v in db.query(Vehicle).filter(Vehicle.code.in_(vehicle_codes)).all()
    }

    def fmt_time(t):
        if not t:
            return "—"
        s = str(t).zfill(4)
        return f"{s[:2]}:{s[2:]}"

    rows = []
    total_km       = 0
    total_duration = 0

    for trip in trips:
        rows.append({
            "date":      trip.departure_date.strftime("%d/%m/%Y"),
            "passenger": trip.passenger_name or "—",
            "purpose":   trip.purpose or "—",
            "km_out":    trip.odometer_out or "—",
            "km_in":     trip.odometer_in or "—",
            "km_run":    trip.km_run or 0,
            "dep_time":  fmt_time(trip.departure_time),
            "arr_time":  fmt_time(trip.arrival_time),
            "duration":  trip.duration_minutes or 0,
            "vehicle":   vehicles.get(trip.vehicle_code, trip.vehicle_code or "—"),
        })
        total_km       += trip.km_run or 0
        total_duration += trip.duration_minutes or 0

    return {
        "report_type":      "driver_log_book",
        "title":            "Driver Log Book",
        "institution":      get_institution_name(db),
        "driver_code":      driver_code,
        "driver_name":      driver.name if driver else driver_code,
        "date_from":        date_from.strftime("%d/%m/%Y"),
        "date_to":          date_to.strftime("%d/%m/%Y"),
        "rows":             rows,
        "total_km":         total_km,
        "total_duration":   total_duration,
    }


def report_income_expenditure(
    db: Session,
    date_from: date,
    date_to: date,
) -> dict:
    """
    Vehicle Income vs Expenditure (EXPTOT):
    Per-vehicle summary of charges collected vs running costs.
    """
    # Income: sum of total_charge per vehicle
    income_rows = db.query(
        Trip.vehicle_code,
        func.sum(Trip.km_run).label("total_km"),
        func.sum(Trip.total_charge).label("total_income"),
    ).filter(
        Trip.departure_date >= date_from,
        Trip.departure_date <= date_to,
    ).group_by(Trip.vehicle_code).all()

    # Expenses: sum of costs per vehicle
    expense_rows = db.query(
        VehicleExpense.vehicle_code,
        func.sum(VehicleExpense.fuel_quantity).label("total_fuel_qty"),
        func.sum(VehicleExpense.fuel_total).label("total_fuel_cost"),
        func.sum(VehicleExpense.repair_charge).label("total_repair"),
        func.sum(VehicleExpense.misc_charge).label("total_misc"),
    ).filter(
        VehicleExpense.date >= date_from,
        VehicleExpense.date <= date_to,
    ).group_by(VehicleExpense.vehicle_code).all()

    # Build lookup dicts
    income_map  = {r.vehicle_code: r for r in income_rows}
    expense_map = {r.vehicle_code: r for r in expense_rows}

    # Get all vehicles that appear in either
    all_codes = set(income_map.keys()) | set(expense_map.keys())
    vehicles  = {
        v.code: v
        for v in db.query(Vehicle).filter(Vehicle.code.in_(all_codes)).all()
    }

    rows = []
    for code in sorted(all_codes):
        vehicle   = vehicles.get(code)
        inc       = income_map.get(code)
        exp       = expense_map.get(code)

        total_km      = int(inc.total_km     or 0) if inc else 0
        total_income  = float(inc.total_income or 0) if inc else 0
        fuel_qty      = float(exp.total_fuel_qty  or 0) if exp else 0
        fuel_cost     = float(exp.total_fuel_cost or 0) if exp else 0
        repair        = float(exp.total_repair    or 0) if exp else 0
        misc          = float(exp.total_misc      or 0) if exp else 0
        total_expense = fuel_cost + repair + misc
        net           = total_income - total_expense

        # KM per litre — avoid division by zero
        km_per_litre = round(total_km / fuel_qty, 2) if fuel_qty > 0 else 0

        rows.append({
            "vehicle_code":  code,
            "vehicle_name":  vehicle.description if vehicle else code,
            "total_km":      total_km,
            "total_income":  round(total_income,  2),
            "fuel_qty":      round(fuel_qty,       2),
            "fuel_cost":     round(fuel_cost,      2),
            "repair":        round(repair,          2),
            "misc":          round(misc,            2),
            "total_expense": round(total_expense,  2),
            "net":           round(net,             2),
            "km_per_litre":  km_per_litre,
        })

    # Column totals
    totals = {
        "total_km":      sum(r["total_km"]      for r in rows),
        "total_income":  round(sum(r["total_income"]  for r in rows), 2),
        "fuel_qty":      round(sum(r["fuel_qty"]       for r in rows), 2),
        "fuel_cost":     round(sum(r["fuel_cost"]      for r in rows), 2),
        "repair":        round(sum(r["repair"]          for r in rows), 2),
        "misc":          round(sum(r["misc"]            for r in rows), 2),
        "total_expense": round(sum(r["total_expense"]  for r in rows), 2),
        "net":           round(sum(r["net"]             for r in rows), 2),
    }

    return {
        "report_type": "income_expenditure",
        "title":       "Vehicle Income & Expenditure",
        "institution": get_institution_name(db),
        "date_from":   date_from.strftime("%d/%m/%Y"),
        "date_to":     date_to.strftime("%d/%m/%Y"),
        "rows":        rows,
        "totals":      totals,
    }


def report_certificate_register(db: Session) -> dict:
    """
    Certificate Expiry Register (CERT):
    All vehicles with their compliance certificate dates.
    """
    vehicles = db.query(Vehicle).order_by(Vehicle.display_order).all()

    today = date.today()

    def days_left(d):
        """How many days until expiry. Negative = already expired."""
        if not d:
            return None
        return (d - today).days

    def fmt_date(d):
        return d.strftime("%d/%m/%Y") if d else "—"

    def status(d):
        """Color coding: expired / expiring soon / ok."""
        if not d:
            return "missing"
        dl = days_left(d)
        if dl < 0:
            return "expired"
        if dl < 30:
            return "soon"
        return "ok"

    rows = []
    for v in vehicles:
        rows.append({
            "code":          v.code,
            "description":   v.description,
            "reg_number":    v.registration_number or "—",
            "road_tax":      {"date": fmt_date(v.road_tax_expiry),    "status": status(v.road_tax_expiry)},
            "insurance":     {"date": fmt_date(v.insurance_expiry),   "status": status(v.insurance_expiry)},
            "fitness":       {"date": fmt_date(v.fitness_cert_expiry),"status": status(v.fitness_cert_expiry)},
            "permit":        {"date": fmt_date(v.permit_expiry),      "status": status(v.permit_expiry)},
            "puc":           {"date": fmt_date(v.puc_expiry),         "status": status(v.puc_expiry)},
            "vs_toll":       {"date": fmt_date(v.vs_toll_tax_expiry), "status": status(v.vs_toll_tax_expiry)},
            "howrah_stn":    {"date": fmt_date(v.howrah_stn_expiry),  "status": status(v.howrah_stn_expiry)},
            "sealdah_stn":   {"date": fmt_date(v.sealdah_stn_expiry), "status": status(v.sealdah_stn_expiry)},
        })

    return {
        "report_type": "certificate_register",
        "title":       "Vehicle Certificate Register",
        "institution": get_institution_name(db),
        "as_of_date":  today.strftime("%d/%m/%Y"),
        "rows":        rows,
    }