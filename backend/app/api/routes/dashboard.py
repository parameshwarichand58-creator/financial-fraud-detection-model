from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import Alert, Case, ModelVersion, Prediction, Transaction, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(current_user)):
    total = db.scalar(select(func.count(Transaction.id))) or 0
    total_value = db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0.0))) or 0.0
    fraud = db.scalar(select(func.count(Prediction.id)).where(Prediction.label == 1)) or 0
    by_band = dict(db.execute(
        select(Prediction.risk_band, func.count(Prediction.id)).group_by(Prediction.risk_band)
    ).all())
    open_alerts = db.scalar(select(func.count(Alert.id)).where(
        Alert.status.in_(["new", "acknowledged", "investigating"])
    )) or 0
    open_cases = db.scalar(select(func.count(Case.id)).where(
        Case.status.in_(["Open", "Investigating", "Pending Review"])
    )) or 0
    active = db.scalar(select(ModelVersion).where(ModelVersion.is_active.is_(True)))
    return {
        "total_transactions": total,
        "total_value": float(total_value),
        "fraudulent": fraud,
        "legitimate": total - fraud,
        "fraud_rate": (fraud / total) if total else None,
        "risk_bands": by_band,
        "open_alerts": open_alerts,
        "open_cases": open_cases,
        "model": {"name": active.name, "version": active.version, "algorithm": active.algorithm} if active else None,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/trends")
def trends(db: Session = Depends(get_db), _: User = Depends(current_user)):
    rows = db.execute(
        select(func.date(Transaction.created_at), func.count(Transaction.id))
        .group_by(func.date(Transaction.created_at))
        .order_by(func.date(Transaction.created_at))
    ).all()
    return [{"date": str(r[0]), "count": r[1]} for r in rows]
