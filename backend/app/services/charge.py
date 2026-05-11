"""
Core charge calculation logic.
Isolated here so it can be tested independently of the API.
"""

def calculate_trip_charge(
    charge_method: str,
    km_run: int,
    km_margin: int,
    fixed_amount: float = 0,
    distance_threshold: int = 0,
    rate_per_km: float = 0,
    override_amount: float = 0,
    bill_extra_km: bool = False,
) -> dict:
    """
    Calculate the total charge for a trip.
    Returns a dict with all charge components.
    """

    fixed_rate_amount = 0
    extra_km = 0
    extra_km_charge = 0

    if charge_method == 'F':            #fixed charge
        fixed_rate_amount = fixed_amount

        # How many km beyond the threshold?
        raw_extra = km_run - distance_threshold

        # Apply tolerance margin — only charge if excess exceeds margin
        net_extra = raw_extra - km_margin
        extra_km = max(0, net_extra)

        # Only bill extra if operator confirmed AND there is excess
        if bill_extra_km and extra_km > 0:
            extra_km_charge = extra_km * rate_per_km

        total = fixed_rate_amount + extra_km_charge + override_amount

    else:  # Per-km
        total = (km_run * rate_per_km) + override_amount
        total = max(total, 0)  # no negative charges

    return {
        "fixed_rate_amount": round(fixed_rate_amount, 2),
        "extra_km": extra_km,
        "extra_km_billed": bill_extra_km and extra_km > 0,
        "extra_km_charge": round(extra_km_charge, 2),
        "override_amount": round(override_amount, 2),
        "total_charge": round(total, 2),
    }