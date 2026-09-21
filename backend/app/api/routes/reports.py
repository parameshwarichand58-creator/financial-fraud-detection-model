"""Report generation endpoints."""
from __future__ import annotations

import io
import json
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user
from app.models import DatasetInfo, ModelVersion, Prediction, Transaction, User

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/transactions.csv")
def transactions_csv(
    limit: int = 5000,
    risk_band: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(current_user),
):
    q = (db.query(Transaction, Prediction)
         .join(Prediction, Prediction.transaction_id == Transaction.id)
         .order_by(desc(Prediction.probability)))
    if risk_band:
        q = q.filter(Prediction.risk_band == risk_band)
    rows = q.limit(limit).all()

    df = pd.DataFrame([{
        "id": tx.id,
        "external_id": tx.external_id,
        "amount": tx.amount,
        "category": tx.category,
        "location": tx.location,
        "model_probability": round(pred.probability, 4),
        "risk_band": pred.risk_band,
        "predicted_label": pred.label,
        "prediction_time": pred.created_at.isoformat(),
    } for tx, pred in rows])

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    filename = f"fraudiq-transactions-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/summary.csv")
def summary_csv(db: Session = Depends(get_db), _: User = Depends(current_user)):
    total = db.scalar(select(func.count(Transaction.id))) or 0
    total_value = db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0.0))) or 0.0
    fraud = db.scalar(select(func.count(Prediction.id)).where(Prediction.label == 1)) or 0
    bands = dict(db.execute(
        select(Prediction.risk_band, func.count(Prediction.id)).group_by(Prediction.risk_band)
    ).all())
    cats = db.execute(
        select(Transaction.category, func.count(Transaction.id)).group_by(Transaction.category)
    ).all()

    lines = [
        "metric,value",
        f"total_transactions,{total}",
        f"total_value,{total_value:.2f}",
        f"fraud_signals,{fraud}",
        f"fraud_rate,{(fraud/total) if total else 0:.6f}",
        "",
        "risk_band,count",
    ]
    for b, n in sorted(bands.items()):
        lines.append(f"{b},{n}")
    lines.append("")
    lines.append("category,count")
    for c, n in cats:
        lines.append(f"{c or 'unknown'},{n}")

    buf = io.StringIO("\n".join(lines))
    filename = f"fraudiq-summary-{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _pdf_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("H0", parent=s["Title"], fontSize=22, spaceAfter=6))
    s.add(ParagraphStyle("Sub", parent=s["Normal"], fontSize=10,
                         textColor=colors.HexColor("#555555"), spaceAfter=16))
    s.add(ParagraphStyle("H1x", parent=s["Heading1"], fontSize=14, spaceBefore=18,
                         spaceAfter=8, textColor=colors.HexColor("#1e293b")))
    s.add(ParagraphStyle("H2x", parent=s["Heading2"], fontSize=11,
                         spaceBefore=10, spaceAfter=6,
                         textColor=colors.HexColor("#334155")))
    s.add(ParagraphStyle("Body", parent=s["BodyText"], fontSize=10, leading=14))
    s.add(ParagraphStyle("Note", parent=s["Normal"], fontSize=8,
                         textColor=colors.HexColor("#777777"), spaceBefore=12))
    return s


def _table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366F1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.HexColor("#F1F5F9")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


@router.get("/model-performance.pdf")
def model_performance_pdf(db: Session = Depends(get_db), _: User = Depends(current_user)):
    model = db.scalar(select(ModelVersion).where(ModelVersion.is_active.is_(True)))
    s = _pdf_styles()
    story = []

    story.append(Paragraph("FraudIQ — Model Performance Report", s["H0"]))
    story.append(Paragraph(
        "Generated " + datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC') +
        " · Financial Fraud Risk Intelligence Platform", s["Sub"]))

    if not model:
        story.append(Paragraph("No active model is available.", s["Body"]))
    else:
        metrics = json.loads(model.metrics_json or "{}")
        all_metrics = json.loads(model.all_metrics_json or "{}")

        story.append(Paragraph("Model Overview", s["H1x"]))
        story.append(_table([
            ["Field", "Value"],
            ["Model name", model.name],
            ["Algorithm", model.algorithm],
            ["Version", model.version],
            ["Trained at", model.created_at.strftime("%Y-%m-%d %H:%M UTC")],
            ["Features", str(len(json.loads(model.feature_names_json or "[]")))],
        ], col_widths=[5 * cm, 11 * cm]))

        story.append(Paragraph("Primary Metrics", s["H1x"]))
        story.append(Paragraph(
            "Fraud datasets are highly imbalanced. Accuracy alone is not a suitable "
            "quality metric — precision, recall, F1 and PR-AUC are the primary criteria.",
            s["Body"]))
        story.append(Spacer(1, 6))

        roc = metrics.get("roc_auc")
        prauc = metrics.get("pr_auc")
        story.append(_table([
            ["Metric", "Value"],
            ["Precision", format(metrics.get('precision', 0), '.4f')],
            ["Recall", format(metrics.get('recall', 0), '.4f')],
            ["F1 Score", format(metrics.get('f1', 0), '.4f')],
            ["ROC-AUC", format(roc, '.4f') if roc else "—"],
            ["PR-AUC", format(prauc, '.4f') if prauc else "—"],
        ], col_widths=[6 * cm, 6 * cm]))

        cmx = metrics.get("confusion_matrix")
        if cmx:
            story.append(Paragraph("Confusion Matrix", s["H1x"]))
            story.append(_table([
                ["", "Predicted Legit", "Predicted Fraud"],
                ["Actual Legit", cmx[0][0], cmx[0][1]],
                ["Actual Fraud", cmx[1][0], cmx[1][1]],
            ], col_widths=[5 * cm, 5 * cm, 5 * cm]))

        if len(all_metrics) > 1:
            story.append(Paragraph("Model Comparison", s["H1x"]))
            rows = [["Model", "Precision", "Recall", "F1", "ROC-AUC", "PR-AUC"]]
            for name, m in all_metrics.items():
                r = m.get("roc_auc")
                p = m.get("pr_auc")
                rows.append([
                    name,
                    format(m.get('precision', 0), '.3f'),
                    format(m.get('recall', 0), '.3f'),
                    format(m.get('f1', 0), '.3f'),
                    format(r, '.3f') if r else "—",
                    format(p, '.3f') if p else "—",
                ])
            story.append(_table(rows))

    story.append(Paragraph(
        "Model outputs are review signals, not confirmed fraud. False positives and "
        "false negatives are possible. Historical patterns may not generalise to future "
        "behaviour. This prototype does not represent production banking infrastructure.",
        s["Note"]))

    buf = io.BytesIO()
    SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm).build(story)
    buf.seek(0)
    filename = f"fraudiq-model-performance-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/dataset-quality.pdf")
def dataset_quality_pdf(db: Session = Depends(get_db), _: User = Depends(current_user)):
    ds = db.scalar(select(DatasetInfo).order_by(DatasetInfo.created_at.desc()))
    s = _pdf_styles()
    story = []

    story.append(Paragraph("FraudIQ — Dataset Quality Report", s["H0"]))
    story.append(Paragraph(
        "Generated " + datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), s["Sub"]))

    if not ds:
        story.append(Paragraph("No dataset has been uploaded yet.", s["Body"]))
    else:
        schema = json.loads(ds.schema_json or "{}")
        quality = json.loads(ds.quality_json or "{}")

        story.append(Paragraph("Dataset Overview", s["H1x"]))
        story.append(_table([
            ["Field", "Value"],
            ["Filename", ds.filename],
            ["Uploaded at", ds.created_at.strftime("%Y-%m-%d %H:%M UTC")],
            ["Rows", format(schema.get('rows', 0), ',')],
            ["Columns", str(schema.get("cols", 0))],
            ["Missing values", format(quality.get('missing', 0), ',')],
            ["Duplicate rows", format(quality.get('duplicates', 0), ',')],
            ["Detected target", schema.get("target") or "—"],
        ], col_widths=[5 * cm, 11 * cm]))

        story.append(Paragraph("Detected Schema", s["H1x"]))
        num = schema.get("numeric_fields", [])
        cat = schema.get("categorical_fields", [])
        dt = schema.get("datetime_fields", [])

        story.append(Paragraph("Numeric fields", s["H2x"]))
        story.append(Paragraph(", ".join(num) or "—", s["Body"]))
        story.append(Paragraph("Categorical fields", s["H2x"]))
        story.append(Paragraph(", ".join(cat) or "—", s["Body"]))
        story.append(Paragraph("Datetime fields", s["H2x"]))
        story.append(Paragraph(", ".join(dt) or "—", s["Body"]))

        story.append(Paragraph("Data Quality Summary", s["H1x"]))
        rows_cnt = max(1, schema.get("rows", 1))
        cols_cnt = max(1, schema.get("cols", 1))
        miss_pct = (quality.get("missing", 0) / (rows_cnt * cols_cnt)) * 100
        dup_pct = (quality.get("duplicates", 0) / rows_cnt) * 100
        story.append(_table([
            ["Check", "Result", "Status"],
            ["Missing values",
             format(quality.get('missing', 0), ',') + " (" + format(miss_pct, '.2f') + "%)",
             "OK" if miss_pct < 1 else "Review"],
            ["Duplicates",
             format(quality.get('duplicates', 0), ',') + " (" + format(dup_pct, '.2f') + "%)",
             "OK" if dup_pct < 1 else "Review"],
            ["Target column", schema.get("target") or "Not detected",
             "OK" if schema.get("target") else "Review"],
        ], col_widths=[5 * cm, 6 * cm, 5 * cm]))

    story.append(Paragraph(
        "This report is generated from the uploaded dataset only. No fields are invented. "
        "If a dimension is absent from the dataset, the corresponding analysis is not performed.",
        s["Note"]))

    buf = io.BytesIO()
    SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm).build(story)
    buf.seek(0)
    filename = f"fraudiq-dataset-quality-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
