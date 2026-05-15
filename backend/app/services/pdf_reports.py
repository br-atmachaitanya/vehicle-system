"""
PDF report generator using ReportLab.
Takes the same data dicts from reports.py and renders them as PDF.
"""

from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import Paragraph as P

# ── Shared styles & helpers ───────────────────────────────────────────────────

def get_styles():
    """Return commonly used paragraph styles."""
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            fontSize=13,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
            spaceAfter=2*mm,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            fontSize=9,
            fontName="Helvetica",
            alignment=TA_CENTER,
            spaceAfter=4*mm,
            textColor=colors.HexColor("#555555"),
        ),
        "section_header": ParagraphStyle(
            "section_header",
            fontSize=9,
            fontName="Helvetica-Bold",
            spaceBefore=4*mm,
            spaceAfter=1*mm,
        ),
        "normal": ParagraphStyle(
            "normal",
            fontSize=8,
            fontName="Helvetica",
        ),
        "footer": ParagraphStyle(
            "footer",
            fontSize=7,
            fontName="Helvetica",
            textColor=colors.HexColor("#888888"),
            alignment=TA_CENTER,
        ),
        "total": ParagraphStyle(
            "total",
            fontSize=9,
            fontName="Helvetica-Bold",
            alignment=TA_RIGHT,
        ),
    }


def base_table_style():
    """Common table styling applied to all report tables."""
    return TableStyle([
        # Header row
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0), 7.5),
        ("ALIGN",        (0, 0), (-1, 0), "CENTER"),
        ("BOTTOMPADDING",(0, 0), (-1, 0), 4),
        ("TOPPADDING",   (0, 0), (-1, 0), 4),

        # Data rows
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 7.5),
        ("TOPPADDING",   (0, 1), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 1), (-1, -1), 3),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1),
            [colors.white, colors.HexColor("#f5f8ff")]),  # alternating rows

        # Grid
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
        ("LINEBELOW",    (0, 0), (-1, 0),  0.8, colors.HexColor("#1e3a5f")),

        # Align numeric columns to right (last column = amount)
        ("ALIGN",        (-1, 1), (-1, -1), "RIGHT"),
    ])


def fmt_inr(amount) -> str:
    """Format number as Indian currency string."""
    return f"Rs. {float(amount):,.2f}"   # Rs.  symbol


def build_pdf_header(story, data: dict, styles: dict):
    """Add institution name + report title + date range to story."""
    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(data["title"], styles["title"]))
    story.append(Paragraph(
        f"From {data['date_from']} to {data['date_to']}",
        styles["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=0.5,
                             color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 3*mm))

def text(content, style_name='normal', styles=None):
    """
    Wrap a string in a Paragraph for auto word-wrapping in table cells.
    Falls back to plain string if content is empty.
    """
    if not content:
        return '—'
    if styles is None:
        styles = get_styles()
    return P(str(content), styles[style_name])

# ── Report-specific PDF builders ─────────────────────────────────────────────

from reportlab.platypus import Paragraph as P

def text(content, style_name='normal', styles=None):
    """
    Wrap a string in a Paragraph for auto word-wrapping in table cells.
    Falls back to plain string if content is empty.
    """
    if not content:
        return '—'
    if styles is None:
        styles = get_styles()
    return P(str(content), styles[style_name])


def pdf_account_bill(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []
    build_pdf_header(story, data, styles)

    for group in data["groups"]:
        story.append(Paragraph(
            f"{group['account_code']} — {group['account_name']}",
            styles["section_header"]
        ))

        table_data = [[
            "Date", "Vehicle", "Passenger", "Purpose", "KM", "Amount (Rs. )"
        ]]

        for trip in group["trips"]:
            table_data.append([
                trip["date"],
                # Paragraph wraps long text automatically
                P(trip["vehicle"],   styles["normal"]),
                P(trip["passenger"], styles["normal"]),
                P(trip["purpose"],   styles["normal"]),
                str(trip["km_run"]),
                fmt_inr(trip["amount"]),
            ])

        table_data.append([
            "", "", "", "Subtotal:", "",
            fmt_inr(group["subtotal"])
        ])

        # Column widths — must add up to page width minus margins
        # A4 portrait usable width = 210 - 24 = 186mm
        col_widths = [18*mm, 38*mm, 36*mm, 58*mm, 13*mm, 23*mm]
        table = Table(table_data, colWidths=col_widths,
                      repeatRows=1)  # repeat header on each page

        style = base_table_style()
        sub_row = len(table_data) - 1
        style.add("BACKGROUND", (0, sub_row), (-1, sub_row),
                  colors.HexColor("#e8f0fe"))
        style.add("FONTNAME",   (0, sub_row), (-1, sub_row), "Helvetica-Bold")
        style.add("ALIGN",      (-2, sub_row), (-1, sub_row), "RIGHT")
        table.setStyle(style)
        story.append(table)
        story.append(Spacer(1, 4*mm))

    story.append(HRFlowable(width="100%", thickness=1,
                             color=colors.HexColor("#1e3a5f")))
    story.append(Paragraph(
        f"Grand Total: {fmt_inr(data['grand_total'])}",
        styles["total"]
    ))
    doc.build(story)
    return buffer.getvalue()


def pdf_credit_bill(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []

    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(
        f"Credit to: {data['credit_name']}", styles["title"]
    ))
    story.append(Paragraph(
        f"From {data['date_from']} to {data['date_to']}",
        styles["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=0.5,
                             color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 3*mm))

    for group in data["groups"]:
        story.append(Paragraph(
            f"Debit: {group['account_code']} — {group['account_name']}",
            styles["section_header"]
        ))
        table_data = [["Date","Vehicle","Passenger","Purpose","KM","Amount (Rs. )"]]
        for trip in group["trips"]:
            table_data.append([
                trip["date"],
                P(trip["vehicle"],   styles["normal"]),
                P(trip["passenger"], styles["normal"]),
                P(trip["purpose"],   styles["normal"]),
                str(trip["km_run"]),
                fmt_inr(trip["amount"]),
            ])
        table_data.append(["","","","Subtotal:","", fmt_inr(group["subtotal"])])

        col_widths = [18*mm, 38*mm, 36*mm, 58*mm, 13*mm, 23*mm]
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        style = base_table_style()
        sub_row = len(table_data) - 1
        style.add("BACKGROUND", (0, sub_row), (-1, sub_row),
                  colors.HexColor("#e8f0fe"))
        style.add("FONTNAME",   (0, sub_row), (-1, sub_row), "Helvetica-Bold")
        table.setStyle(style)
        story.append(table)
        story.append(Spacer(1, 4*mm))

    story.append(HRFlowable(width="100%", thickness=1,
                             color=colors.HexColor("#1e3a5f")))
    story.append(Paragraph(
        f"Grand Total: {fmt_inr(data['grand_total'])}",
        styles["total"]
    ))
    doc.build(story)
    return buffer.getvalue()


def pdf_log_book(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []

    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(
        f"Vehicle Log Book — {data['vehicle_name']}", styles["title"]
    ))
    story.append(Paragraph(
        f"From {data['date_from']} to {data['date_to']}", styles["subtitle"]
    ))
    story.append(Spacer(1, 3*mm))

    table_data = [[
        "Date", "Passenger", "Purpose",
        "KM Out", "KM In", "KM Run",
        "Dep", "Arr", "Account", "Driver"
    ]]
    for row in data["rows"]:
        table_data.append([
            row["date"],
            P(row["passenger"], styles["normal"]),
            P(row["purpose"],   styles["normal"]),
            str(row["km_out"]),
            str(row["km_in"]),
            str(row["km_run"]),
            row["dep_time"],
            row["arr_time"],
            P(row["account"],   styles["normal"]),
            P(row["driver"],    styles["normal"]),
        ])

    table_data.append([
        "","","","","Total KM:",
        str(data["total_km"]),
        "","","",""
    ])

    # A4 landscape usable width = 297 - 24 = 273mm
    col_widths = [18*mm, 35*mm, 60*mm, 18*mm, 18*mm,
                  18*mm, 14*mm, 14*mm, 50*mm, 28*mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    style = base_table_style()
    total_row = len(table_data) - 1
    style.add("BACKGROUND", (0, total_row), (-1, total_row),
              colors.HexColor("#e8f0fe"))
    style.add("FONTNAME",   (0, total_row), (-1, total_row), "Helvetica-Bold")
    table.setStyle(style)
    story.append(table)
    doc.build(story)
    return buffer.getvalue()


def pdf_driver_log_book(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []

    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(
        f"Driver Log Book — {data['driver_name']}", styles["title"]
    ))
    story.append(Paragraph(
        f"From {data['date_from']} to {data['date_to']}", styles["subtitle"]
    ))
    story.append(Spacer(1, 3*mm))

    table_data = [[
        "Date", "Passenger", "Purpose",
        "KM Out", "KM In", "KM Run",
        "Dep", "Arr", "Dur(min)", "Vehicle"
    ]]
    for row in data["rows"]:
        table_data.append([
            row["date"],
            P(row["passenger"], styles["normal"]),
            P(row["purpose"],   styles["normal"]),
            str(row["km_out"]),
            str(row["km_in"]),
            str(row["km_run"]),
            row["dep_time"],
            row["arr_time"],
            str(row["duration"]),
            P(row["vehicle"],   styles["normal"]),
        ])

    table_data.append([
        "","","","","Total:",
        str(data["total_km"]),
        "","",str(data["total_duration"]),""
    ])

    # A4 landscape = 273mm usable
    col_widths = [18*mm, 35*mm, 60*mm, 18*mm, 18*mm,
                  18*mm, 14*mm, 14*mm, 20*mm, 58*mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    style = base_table_style()
    total_row = len(table_data) - 1
    style.add("BACKGROUND", (0, total_row), (-1, total_row),
              colors.HexColor("#e8f0fe"))
    style.add("FONTNAME",   (0, total_row), (-1, total_row), "Helvetica-Bold")
    table.setStyle(style)
    story.append(table)
    doc.build(story)
    return buffer.getvalue()


def pdf_income_expenditure(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []

    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(data["title"], styles["title"]))
    story.append(Paragraph(
        f"From {data['date_from']} to {data['date_to']}", styles["subtitle"]
    ))
    story.append(Spacer(1, 3*mm))

    table_data = [[
        "Vehicle", "KM", "Income\n(Rs. )",
        "Fuel\n(L)", "Fuel\n(Rs. )", "Repair\n(Rs. )",
        "Misc\n(Rs. )", "Total Exp\n(Rs. )", "Net\n(Rs. )", "KM/L"
    ]]
    for row in data["rows"]:
        table_data.append([
            P(row["vehicle_name"], styles["normal"]),
            str(row["total_km"]),
            fmt_inr(row["total_income"]),
            str(row["fuel_qty"]),
            fmt_inr(row["fuel_cost"]),
            fmt_inr(row["repair"]),
            fmt_inr(row["misc"]),
            fmt_inr(row["total_expense"]),
            fmt_inr(row["net"]),
            str(row["km_per_litre"]),
        ])

    t = data["totals"]
    table_data.append([
        "TOTAL", str(t["total_km"]),
        fmt_inr(t["total_income"]),
        str(t["fuel_qty"]),
        fmt_inr(t["fuel_cost"]),
        fmt_inr(t["repair"]),
        fmt_inr(t["misc"]),
        fmt_inr(t["total_expense"]),
        fmt_inr(t["net"]),
        "—",
    ])

    # A4 landscape = 273mm usable
    col_widths = [58*mm, 16*mm, 24*mm, 16*mm, 24*mm,
                  24*mm, 22*mm, 26*mm, 26*mm, 15*mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    style = base_table_style()
    total_row = len(table_data) - 1
    style.add("BACKGROUND", (0, total_row), (-1, total_row),
              colors.HexColor("#1e3a5f"))
    style.add("TEXTCOLOR",  (0, total_row), (-1, total_row), colors.white)
    style.add("FONTNAME",   (0, total_row), (-1, total_row), "Helvetica-Bold")
    table.setStyle(style)
    story.append(table)
    doc.build(story)
    return buffer.getvalue()


def pdf_certificate_register(data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=10*mm, rightMargin=10*mm,
        topMargin=12*mm, bottomMargin=12*mm
    )
    styles = get_styles()
    story  = []

    story.append(Paragraph(data["institution"], styles["title"]))
    story.append(Paragraph(data["title"], styles["title"]))
    story.append(Paragraph(
        f"As of {data['as_of_date']}", styles["subtitle"]
    ))
    story.append(Spacer(1, 3*mm))

    table_data = [[
        "Vehicle", "Reg No",
        "Road\nTax", "Insurance", "Fitness",
        "Permit", "PUC", "VS Toll",
        "Howrah\nStn", "Sealdah\nStn"
    ]]

    # Status colors for PDF
    status_colors = {
        'expired': colors.HexColor("#dc2626"),
        'soon':    colors.HexColor("#ea580c"),
        'ok':      colors.black,
        'missing': colors.HexColor("#9ca3af"),
    }

    for row in data["rows"]:
        cert_cells = []
        for field in ["road_tax","insurance","fitness","permit",
                      "puc","vs_toll","howrah_stn","sealdah_stn"]:
            d = row[field]["date"]
            s = row[field]["status"]
            color = status_colors.get(s, colors.black)
            # Use colored Paragraph for status
            cert_cells.append(
                P(f'<font color="{color.hexval() if hasattr(color, "hexval") else "#000"}">'
                  f'{d}</font>',
                  styles["normal"])
                if s in ('expired', 'soon')
                else d
            )

        table_data.append([
            P(row["description"], styles["normal"]),
            row["reg_number"],
            *cert_cells
        ])

    # A4 landscape = 277mm usable (tighter margins)
    col_widths = [52*mm, 24*mm, 20*mm, 22*mm, 20*mm,
                  20*mm, 20*mm, 20*mm, 22*mm, 22*mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    style = base_table_style()
    # Make expired cells red background
    for ri, row in enumerate(data["rows"], start=1):
        for ci, field in enumerate(
            ["road_tax","insurance","fitness","permit",
             "puc","vs_toll","howrah_stn","sealdah_stn"],
            start=2
        ):
            s = row[field]["status"]
            if s == 'expired':
                style.add("BACKGROUND", (ci, ri), (ci, ri),
                          colors.HexColor("#fee2e2"))
            elif s == 'soon':
                style.add("BACKGROUND", (ci, ri), (ci, ri),
                          colors.HexColor("#fff7ed"))

    table.setStyle(style)
    story.append(table)

    # Legend
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Red background = Expired  |  Orange background = Expiring within 30 days',
        styles["footer"]
    ))

    doc.build(story)
    return buffer.getvalue()

# ── Dispatch table — maps report_type to PDF builder ────────────────────────

PDF_BUILDERS = {
    "account_bill":         pdf_account_bill,
    "credit_bill":          pdf_credit_bill,
    "log_book":             pdf_log_book,
    "driver_log_book":      pdf_driver_log_book,
    "income_expenditure":   pdf_income_expenditure,
    "certificate_register": pdf_certificate_register,
}

def generate_pdf(report_type: str, data: dict) -> bytes:
    """
    Main entry point.
    Given a report_type string and data dict, returns PDF bytes.
    """
    builder = PDF_BUILDERS.get(report_type)
    if not builder:
        raise ValueError(f"Unknown report type: {report_type}")
    return builder(data)