from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from app.database import get_db
from app.services.auth import get_current_user
from app.services import reports as report_svc
from app.services.pdf_reports import generate_pdf

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    # All report endpoints require login
    dependencies=[Depends(get_current_user)]
)

# ── Helper: return JSON or PDF based on ?format=pdf query param ──────────────

def respond(data: dict, fmt: str, filename: str):
    """
    If fmt == 'pdf': generate and return PDF file.
    Otherwise: return JSON for browser rendering.
    """
    if fmt == "pdf":
        pdf_bytes = generate_pdf(data["report_type"], data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                # attachment = browser downloads it
                # inline = browser opens it in PDF viewer
                "Content-Disposition": f'attachment; filename="{filename}.pdf"'
            }
        )
    return data   # FastAPI auto-serialises dict to JSON


@router.get("/account-bill")
def account_bill(
    date_from:    date            = Query(..., description="Start date YYYY-MM-DD"),
    date_to:      date            = Query(..., description="End date YYYY-MM-DD"),
    account_code: Optional[str]   = Query(None, description="Leave blank for all accounts"),
    format:       str             = Query("json", description="json or pdf"),
    db:           Session         = Depends(get_db),
):
    data = report_svc.report_account_bill(db, date_from, date_to, account_code)
    return respond(data, format, f"account_bill_{date_from}_{date_to}")


@router.get("/credit-bill")
def credit_bill(
    date_from:   date    = Query(...),
    date_to:     date    = Query(...),
    credit_code: str     = Query(..., description="Credit account code"),
    format:      str     = Query("json"),
    db:          Session = Depends(get_db),
):
    data = report_svc.report_credit_bill(db, date_from, date_to, credit_code)
    return respond(data, format, f"credit_bill_{date_from}_{date_to}")


@router.get("/log-book")
def log_book(
    date_from:    date    = Query(...),
    date_to:      date    = Query(...),
    vehicle_code: str     = Query(...),
    format:       str     = Query("json"),
    db:           Session = Depends(get_db),
):
    data = report_svc.report_log_book(db, date_from, date_to, vehicle_code)
    return respond(data, format, f"logbook_{vehicle_code}_{date_from}_{date_to}")


@router.get("/driver-log-book")
def driver_log_book(
    date_from:   date    = Query(...),
    date_to:     date    = Query(...),
    driver_code: str     = Query(...),
    format:      str     = Query("json"),
    db:          Session = Depends(get_db),
):
    data = report_svc.report_driver_log_book(db, date_from, date_to, driver_code)
    return respond(data, format, f"driver_log_{driver_code}_{date_from}_{date_to}")


@router.get("/income-expenditure")
def income_expenditure(
    date_from: date    = Query(...),
    date_to:   date    = Query(...),
    format:    str     = Query("json"),
    db:        Session = Depends(get_db),
):
    data = report_svc.report_income_expenditure(db, date_from, date_to)
    return respond(data, format, f"income_exp_{date_from}_{date_to}")


@router.get("/certificate-register")
def certificate_register(
    format: str     = Query("json"),
    db:     Session = Depends(get_db),
):
    data = report_svc.report_certificate_register(db)
    return respond(data, format, "certificate_register")