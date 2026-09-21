from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import ModelVersion, Prediction, Transaction, User

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
def list_tx(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    risk_band: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(current_user),
):
    q = (db.query(Transaction, Prediction)
         .join(Prediction, Prediction.transaction_id == Transaction.id)
         .order_by(desc(Prediction.probability)))
    if risk_band:
        q = q.filter(Prediction.risk_band == risk_band)
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "items": [{
            "id": tx.id, "external_id": tx.external_id, "amount": tx.amount,
            "category": tx.category, "location": tx.location,
            "probability": pred.probability, "label": pred.label,
            "risk_band": pred.risk_band,
        } for tx, pred in rows],
    }


@router.get("/{txn_id}")
def get_tx(txn_id: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    tx = db.get(Transaction, txn_id)
    if not tx:
        raise HTTPException(404, "Transaction not found")
    pred = db.query(Prediction).filter(Prediction.transaction_id == txn_id).order_by(
        desc(Prediction.created_at)).first()
    model = db.scalar(select(ModelVersion).where(ModelVersion.is_active.is_(True)))
    import json
    features = []
    if model:
        try:
            features = json.loads(model.feature_names_json or "[]")[:12]
        except Exception:
            features = []
    return {
        "id": tx.id, "external_id": tx.external_id, "amount": tx.amount,
        "category": tx.category, "location": tx.location,
        "probability": pred.probability if pred else None,
        "label": pred.label if pred else None,
        "risk_band": pred.risk_band if pred else None,
        "model_version": model.version if model else None,
        "model_algorithm": model.algorithm if model else None,
        "feature_names": features,
    }
