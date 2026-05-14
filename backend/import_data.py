"""
One-time data import script.
Reads all DBF files and inserts into vehicles.db

Usage:
    cd backend
    source venv/bin/activate
    python import_data.py --dbf-dir /path/to/dbf/files

Run this ONCE on a fresh database.
Safe to re-run — it clears existing data before importing.
"""

import sys
import os
import argparse
from datetime import date
from dbfread import DBF

# Add the app to path so we can import our models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.vehicle import Vehicle
from app.models.account import Account
from app.models.credit_account import CreditAccount
from app.models.user import User
from app.models.driver import Driver
from app.models.fixed_rate import FixedRate
from app.models.purpose import Purpose
from app.models.institution import Institution
import app.models  # ensure all models are registered

# ── Helpers ──────────────────────────────────────────────────────────────────

def read_dbf(path, encoding='latin-1'):
    """
    Read a DBF file, return list of dicts.
    Automatically handles presence/absence of memo (.FPT) files.
    """
    if not os.path.exists(path):
        print(f"  ⚠ File not found: {path}")
        return []

    try:
        # Check if a matching .FPT memo file exists
        # FPT file has same name as DBF but different extension
        fpt_path = os.path.splitext(path)[0] + '.FPT'
        fpt_exists = os.path.exists(fpt_path)

        # Also check lowercase extension (Linux is case-sensitive)
        if not fpt_exists:
            fpt_path_lower = os.path.splitext(path)[0] + '.fpt'
            fpt_exists = os.path.exists(fpt_path_lower)

        if fpt_exists:
            # Memo file present — read normally, memo fields will be populated
            print(f"  📎 Memo file found: {os.path.basename(fpt_path)}")
            table = DBF(path, encoding=encoding)
        else:
            # No memo file — ignore missing memo gracefully
            table = DBF(path, encoding=encoding, ignore_missing_memofile=True)

        return [dict(rec) for rec in table]

    except Exception as e:
        print(f"  ✗ Error reading {path}: {e}")
        return []

def clean_str(val, default=''):
    """Strip whitespace from string fields. Return default if None or blank."""
    if val is None:
        return default
    # str() handles non-string types, strip() removes whitespace
    result = str(val).strip()
    # Treat strings that are all whitespace as empty
    return result if result else default

def clean_date(val):
    """Convert DBF date to Python date. Return None if invalid."""
    if val is None:
        return None
    # dbfread returns date objects directly for date fields
    if isinstance(val, date):
        # FoxPro uses a blank date (year 0 or 1) to mean "no date"
        if val.year < 1900:
            return None
        return val
    return None

def clean_num(val, default=0):
    """Convert numeric field, return default if None."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

# ── Importers ────────────────────────────────────────────────────────────────

def import_institution(db, dbf_dir):
    print("\n📋 Importing Institution Settings...")
    records = read_dbf(os.path.join(dbf_dir, 'INSTADD.DBF'))
    if not records:
        print("  ⚠ No institution data found")
        return

    rec = records[0]  # only 1 record

    # Clear existing
    db.query(Institution).delete()

    inst = Institution(
        name=clean_str(rec.get('INSTNAME'), 'Ramakrishna Math'),
        address=clean_str(rec.get('INSTADD')),
        city=clean_str(rec.get('INSTCITY')),
        pin_code=clean_str(rec.get('INSTPIN')),
        phone=clean_str(rec.get('INSTPHONE')),
        fax=clean_str(rec.get('INSTFAX')),
        fiscal_year_start=clean_str(rec.get('ACCYR1'), '2026'),
        fiscal_year_end=clean_str(rec.get('ACCYR2'), '2027'),
        km_margin=int(clean_num(rec.get('KMMARGIN'), 0)),
        frequent_destinations=clean_str(rec.get('FREQPLACES')),
    )
    db.add(inst)
    print(f"  ✓ Institution: {inst.name}")

def import_credit_accounts(db, dbf_dir):
    print("\n💳 Importing Credit Accounts...")
    records = read_dbf(os.path.join(dbf_dir, 'CREDMST.DBF'))
    if not records:
        print("  ⚠ No credit account data found")
        return

    db.query(CreditAccount).delete()

    count = 0
    for rec in records:
        code = clean_str(rec.get('CRCODE'))
        if not code:
            continue
        ca = CreditAccount(
            code=code,
            name=clean_str(rec.get('CRDESC'), f'Account {code}'),
            linked_account_code=clean_str(rec.get('ACCODE')),
            display_order=int(clean_num(rec.get('SLNO'), 0)),
        )
        db.add(ca)
        count += 1

    print(f"  ✓ {count} credit accounts imported")

def import_vehicles(db, dbf_dir):
    print("\n🚗 Importing Vehicles...")
    records = read_dbf(os.path.join(dbf_dir, 'VEHMST.DBF'))
    if not records:
        print("  ⚠ No vehicle data found")
        return

    db.query(Vehicle).delete()

    count = 0
    seen_codes = set()  # track codes we've already inserted
    for rec in records:
        code = clean_str(rec.get('VEHCODE'))
        if not code:
            continue
        if code in seen_codes:
            print(f"  ⚠ Duplicate vehicle code skipped: '{code}'")
            continue
        seen_codes.add(code)

        # VEH field = 'Y' means active
        active = clean_str(rec.get('VEH'), 'Y').upper() == 'Y'

        v = Vehicle(
            code=code,
            description=clean_str(rec.get('VEHDESC'), code),
            registration_number=clean_str(rec.get('VEHNO')),
            vehicle_type=clean_str(rec.get('TYPE'), 'P'),
            rate_per_km=clean_num(rec.get('RATE'), 0),
            credit_account_code=clean_str(rec.get('CRCODE')),
            active=active,
            display_order=int(clean_num(rec.get('SLNO'), 0)),
            road_tax_expiry=clean_date(rec.get('RTAX')),
            insurance_expiry=clean_date(rec.get('INSURANCE')),
            fitness_cert_expiry=clean_date(rec.get('CF')),
            permit_expiry=clean_date(rec.get('PERMIT')),
            puc_expiry=clean_date(rec.get('PUC')),
            vs_toll_tax_expiry=clean_date(rec.get('VSTOLLTAX')),
            howrah_stn_expiry=clean_date(rec.get('HOWRAHSTN')),
            sealdah_stn_expiry=clean_date(rec.get('SEALDAHSTN')),
        )
        db.add(v)
        count += 1

    print(f"  ✓ {count} vehicles imported")

def import_accounts(db, dbf_dir):
    print("\n📂 Importing Accounts (352)...")
    records = read_dbf(os.path.join(dbf_dir, 'ACCMST.DBF'))
    if not records:
        print("  ⚠ No account data found")
        return

    db.query(Account).delete()

    count = 0
    skipped = 0
    seen_codes = set()  # track codes we've already inserted
    for rec in records:
        code = clean_str(rec.get('ACCODE'))
        if not code:
            skipped += 1
            continue
        if code in seen_codes:
            print(f"  ⚠ Duplicate account code skipped: '{code}'")
            skipped += 1
            continue
        seen_codes.add(code)
        a = Account(
            code=code,
            name=clean_str(rec.get('ACDESC'), f'Account {code}'),
            rate_per_km=clean_num(rec.get('RATE'), 0),
            is_independent_centre=clean_str(rec.get('INDCENTRE'), 'N').upper() == 'Y',
            preferred_credit_code=clean_str(rec.get('CRDESC')),
            display_order=int(clean_num(rec.get('SLNO'), 0)),
        )
        db.add(a)
        count += 1

    print(f"  ✓ {count} accounts imported")

def import_users(db, dbf_dir):
    print("\n👤 Importing Users...")
    records = read_dbf(os.path.join(dbf_dir, 'USERMST.DBF'))
    if not records:
        print("  ⚠ No user data found")
        return

    db.query(User).delete()

    count = 0
    skipped = 0
    seen_codes = set()  # track codes we've already inserted

    for rec in records:
        code = clean_str(rec.get('UCODE'))

        # Skip if no code
        if not code:
            skipped += 1
            continue

        # Skip if we've already seen this code (duplicate)
        if code in seen_codes:
            print(f"  ⚠ Duplicate user code skipped: '{code}'")
            skipped += 1
            continue

        seen_codes.add(code)

        u = User(
            code=code,
            formal_name=clean_str(rec.get('UNAME'), code),
            common_name=clean_str(rec.get('UNAME1')),
            rate_per_km=clean_num(rec.get('RATE'), 0),
            is_independent_centre=clean_str(
                rec.get('INDCENTRE'), 'N').upper() == 'Y',
            preferred_credit_code=clean_str(rec.get('CRDESC')),
            display_order=int(clean_num(rec.get('SLNO'), 0)),
        )
        db.add(u)
        count += 1

    print(f"  ✓ {count} users imported, {skipped} skipped")

def import_drivers(db, dbf_dir):
    print("\n👨‍✈️ Importing Drivers...")
    records = read_dbf(os.path.join(dbf_dir, 'DRIVER.DBF'))
    if not records:
        print("  ⚠ No driver data found")
        return

    db.query(Driver).delete()

    count = 0
    for rec in records:
        code = clean_str(rec.get('DCODE'))
        if not code:
            continue
        d = Driver(
            code=code,
            name=clean_str(rec.get('DNAME'), code),
            display_order=int(clean_num(rec.get('SLNO'), 0)),
        )
        db.add(d)
        count += 1

    print(f"  ✓ {count} drivers imported")

def import_fixed_rates(db, dbf_dir):
    print("\n💰 Importing Fixed Rates...")
    records = read_dbf(os.path.join(dbf_dir, 'FIXRTMST.DBF'))
    if not records:
        print("  ⚠ No fixed rate data found")
        return

    db.query(FixedRate).delete()

    count = 0
    for rec in records:
        code = clean_str(rec.get('FIXCODE'))
        if not code:
            continue
        fr = FixedRate(
            code=code,
            description=clean_str(rec.get('FIXDESC'), code),
            fixed_amount=clean_num(rec.get('FIXAMT'), 0),
            distance_threshold_km=int(clean_num(rec.get('FIXKM'), 0)),
            display_order=int(clean_num(rec.get('SLNO'), 0)),
        )
        db.add(fr)
        count += 1

    print(f"  ✓ {count} fixed rates imported")

def import_purposes(db, dbf_dir):
    print("\n📍 Importing Purposes...")
    records = read_dbf(os.path.join(dbf_dir, 'PURPOSE.DBF'))
    if not records:
        print("  ⚠ No purpose data found")
        return

    db.query(Purpose).delete()

    count = 0
    seen = set()  # track duplicates
    for rec in records:
        text = clean_str(rec.get('PURPOSE'))
        if not text or text in seen:
            continue
        seen.add(text)
        p = Purpose(text=text)
        db.add(p)
        count += 1

    print(f"  ✓ {count} purposes imported")

def import_trips(db, dbf_dir):
    """
    Import historical trip journals.
    Looks for files named JRyyyy.DBF (e.g. JR2627.DBF)
    """
    print("\n🗺  Importing Trip Journals...")

    # Find all JR*.DBF files in the directory
    jr_files = [
        f for f in os.listdir(dbf_dir)
        if f.upper().startswith('JR') and f.upper().endswith('.DBF')
        and len(f) == 10  # JR + 4 digits + .DBF = 10 chars
    ]

    if not jr_files:
        print("  ⚠ No journal files (JRyyyy.DBF) found")
        return

    # Import trips table (clear first)
    from app.models.trip import Trip
    db.query(Trip).delete()

    total = 0
    for filename in sorted(jr_files):
        # Extract fiscal year from filename: JR2627.DBF → "2627"
        fiscal_year = filename[2:6].upper()
        path = os.path.join(dbf_dir, filename)
        records = read_dbf(path)

        count = 0
        for rec in records:
            # Skip records with no date
            dep_date = clean_date(rec.get('DATE'))
            if not dep_date:
                continue
            # Skip trips with no vehicle code — they'd break reports
            veh_code = clean_str(rec.get('VEHCODE'))
            if not veh_code:
                skipped += 1
                continue
            # Parse time: stored as integer HHMM e.g. 1430
            dep_time = rec.get('DEPT')
            arr_time = rec.get('ARRV')

            t = Trip(
                fiscal_year=fiscal_year,
                departure_date=dep_date,
                arrival_date=clean_date(rec.get('ARRDATE')),
                vehicle_code=clean_str(rec.get('VEHCODE')),
                account_code=clean_str(rec.get('ACCODE')),
                driver_code=clean_str(rec.get('DCODE')),
                credit_account_code=clean_str(rec.get('CRCODE')),
                passenger_name=clean_str(rec.get('UNAME')),
                name_from_master=clean_str(rec.get('UNAMEFMF'), 'Y').upper() == 'Y',
                purpose=clean_str(rec.get('PURPOSE')),
                purpose_extra=clean_str(rec.get('PURPOSE1')),
                odometer_out=int(clean_num(rec.get('KMOUT'), 0)) or None,
                odometer_in=int(clean_num(rec.get('KMIN'), 0)) or None,
                km_run=int(clean_num(rec.get('KMRUN'), 0)),
                departure_time=int(clean_num(dep_time, 0)) or None,
                arrival_time=int(clean_num(arr_time, 0)) or None,
                duration_minutes=int(clean_num(rec.get('DURATION'), 0)) or None,
                charge_method='F' if clean_str(rec.get('FIXED'), 'N').upper() == 'Y' else 'K',
                fixed_rate_code=clean_str(rec.get('FIXCODE')),
                fixed_rate_amount=clean_num(rec.get('FIXAMT'), 0),
                extra_km=int(clean_num(rec.get('EXTRAKM'), 0)),
                extra_km_billed=clean_str(rec.get('OKEXTKMBL'), 'N').upper() == 'Y',
                extra_km_charge=clean_num(rec.get('EXTKMBL'), 0),
                override_amount=clean_num(rec.get('SPAMT'), 0),
                total_charge=clean_num(rec.get('TOTAMT'), 0),
            )
            db.add(t)
            count += 1

        print(f"  ✓ {filename}: {count} trips")
        total += count

    print(f"  Total: {total} trips imported")

def import_expenses(db, dbf_dir):
    """Import vehicle expenses from VEXPyyyy.DBF files."""
    print("\n⛽ Importing Vehicle Expenses...")

    vexp_files = [
        f for f in os.listdir(dbf_dir)
        if f.upper().startswith('VEXP') and f.upper().endswith('.DBF')
    ]

    if not vexp_files:
        print("  ⚠ No expense files (VEXPyyyy.DBF) found")
        return

    from app.models.vehicle_expense import VehicleExpense
    db.query(VehicleExpense).delete()

    total = 0
    for filename in sorted(vexp_files):
        # VEXP2627.DBF → "2627"
        fiscal_year = filename[4:8].upper()
        path = os.path.join(dbf_dir, filename)
        records = read_dbf(path)

        count = 0
        for rec in records:
            exp_date = clean_date(rec.get('DATE'))
            if not exp_date:
                continue

            e = VehicleExpense(
                fiscal_year=fiscal_year,
                date=exp_date,
                vehicle_code=clean_str(rec.get('VEHCODE')),
                fuel_quantity=clean_num(rec.get('FUEL'), 0),
                fuel_rate=clean_num(rec.get('FRATE'), 0),
                fuel_total=clean_num(rec.get('FPRICE'), 0),
                repair_charge=clean_num(rec.get('REPCHARGE'), 0),
                misc_charge=clean_num(rec.get('MISCHARGE'), 0),
                details=clean_str(rec.get('DETAILS')),
                remarks=clean_str(rec.get('REMARKS')),
                entry_sequence=int(clean_num(rec.get('SLNO'), 0)),
            )
            db.add(e)
            count += 1

        print(f"  ✓ {filename}: {count} expense records")
        total += count

    print(f"  Total: {total} expense records imported")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Import DBF data into vehicles.db')
    parser.add_argument(
        '--dbf-dir',
        required=True,
        help='Path to folder containing .DBF files'
    )
    parser.add_argument(
        '--skip-trips',
        action='store_true',
        help='Skip importing trip journal files (faster for testing)'
    )
    args = parser.parse_args()

    dbf_dir = os.path.abspath(args.dbf_dir)
    if not os.path.isdir(dbf_dir):
        print(f"✗ Directory not found: {dbf_dir}")
        sys.exit(1)

    print(f"📁 Importing from: {dbf_dir}")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Import in dependency order
        # (credit accounts before vehicles, because vehicles reference them)
        import_institution(db, dbf_dir)
        import_credit_accounts(db, dbf_dir)
        import_vehicles(db, dbf_dir)
        import_accounts(db, dbf_dir)
        import_users(db, dbf_dir)
        import_drivers(db, dbf_dir)
        import_fixed_rates(db, dbf_dir)
        import_purposes(db, dbf_dir)

        if not args.skip_trips:
            import_trips(db, dbf_dir)
            import_expenses(db, dbf_dir)

        # Commit everything at once
        # If anything fails, the whole import rolls back — no partial data
        db.commit()
        print("\n✅ Import complete!")

    except Exception as e:
        db.rollback()  # undo everything if any error occurred
        print(f"\n✗ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()

if __name__ == '__main__':
    main()