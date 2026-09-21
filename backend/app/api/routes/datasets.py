import io
import json
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core import get_settings
from app.db import get_db
from app.deps import current_user
from app.ml.data_loader import infer_schema
from app.ml.trainer import train_and_persist
from app.models import (
    Alert, AuditLog, Case, CaseEvent, DatasetInfo,
    ModelVersion, Prediction, Transaction, User,
)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])
settings = get_settings()


def _clear_all(db: Session) -> None:
    """Wipe all data tables except users."""
    db.query(Alert).delete()
    db.query(Prediction).delete()
    db.query(CaseEvent).delete()
    db.query(Case).delete()
    db.query(Transaction).delete()
    db.query(ModelVersion).delete()
    db.query(DatasetInfo).delete()
    db.query(AuditLog).delete()
    db.commit()


def _clear_uploads() -> None:
    d = Path(settings.UPLOADS_DIR)
    if d.exists():
        for f in d.iterdir():
            if f.is_file() and f.name != ".gitkeep":
                try:
                    f.unlink()
                except Exception:
                    pass


def _clear_models() -> None:
    d = Path(settings.MODELS_DIR)
    if d.exists():
        for f in d.iterdir():
            if f.is_file() and f.name != ".gitkeep":
                try:
                    f.unlink()
                except Exception:
                    pass


@router.post("/reset")
def reset(db: Session = Depends(get_db), user: User = Depends(current_user)):
    _clear_all(db)
    _clear_uploads()
    _clear_models()
    db.add(AuditLog(user_id=user.id, action="reset_dataset",
                    entity="system", entity_id=None, detail="Manual reset"))
    db.commit()
    return {"ok": True, "message": "All dataset, model and case data cleared."}


@router.post("/upload")
async def upload(file: UploadFile = File(...),
                 db: Session = Depends(get_db),
                 user: User = Depends(current_user)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, f"Could not parse CSV: {exc}")
    if df.empty:
        raise HTTPException(400, "CSV is empty")

    # Wipe previous data so a new upload replaces rather than appends
    _clear_all(db)
    _clear_uploads()
    _clear_models()

    dest = Path(settings.UPLOADS_DIR) / file.filename
    dest.write_bytes(raw)

    schema = infer_schema(df)
    quality = {
        "missing": schema["missing"],
        "duplicates": schema["duplicates"],
        "rows": schema["rows"],
        "cols": schema["cols"],
    }

    bundle = train_and_persist(df, dataset_name=file.filename)

    mv = ModelVersion(
        name=bundle["name"], algorithm=bundle["algorithm"], version=bundle["version"],
        artifact_path=bundle["artifact_path"],
        metrics_json=json.dumps(bundle["metrics"]),
        all_metrics_json=json.dumps(bundle["all_metrics"]),
        feature_names_json=json.dumps(bundle["feature_names"]),
        is_active=True,
    )
    db.add(mv); db.commit(); db.refresh(mv)

    db.add(DatasetInfo(
        filename=file.filename, rows=schema["rows"], cols=schema["cols"],
        schema_json=json.dumps(schema), quality_json=json.dumps(quality),
    ))

    sample = bundle["predictions_df"].head(5000)
    txs: list[Transaction] = []
    for _, row in sample.iterrows():
        txs.append(Transaction(
            external_id=str(row["external_id"]) if "external_id" in row and pd.notna(row.get("external_id")) else None,
            amount=float(row["amount"]) if "amount" in row and pd.notna(row.get("amount")) else None,
            category=str(row["category"]) if "category" in row and pd.notna(row.get("category")) else None,
            location=str(row["location"]) if "location" in row and pd.notna(row.get("location")) else None,
        ))
    db.add_all(txs); db.commit()

    alerts = 0
    for tx, (_, row) in zip(txs, sample.iterrows()):
        db.add(Prediction(
            transaction_id=tx.id, model_version_id=mv.id,
            probability=float(row["probability"]), label=int(row["label"]),
            risk_band=str(row["risk_band"]),
        ))
        if row["risk_band"] in ("High", "Critical"):
            db.add(Alert(
                transaction_id=tx.id,
                severity=row["risk_band"].lower(),
                category="high_risk" if row["risk_band"] == "High" else "critical_risk",
                reason="Model probability " + format(row["probability"], ".3f") + " (" + str(row["risk_band"]) + " review risk)",
                status="new",
            ))
            alerts += 1
    db.add(AuditLog(user_id=user.id, action="upload_dataset", entity="dataset",
                    entity_id=file.filename, detail=str(len(txs)) + " rows"))
    db.commit()

    return {
        "dataset": file.filename, "schema": schema, "quality": quality,
        "rows_ingested": len(txs), "alerts_created": alerts,
        "model": {"name": mv.name, "version": mv.version, "algorithm": mv.algorithm,
                  "metrics": bundle["metrics"]},
    }
