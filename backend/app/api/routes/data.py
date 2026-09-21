from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import DatasetInfo, Transaction, User

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(current_user)):
    total = db.scalar(select(func.count(Transaction.id))) or 0
    total_value = db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0.0))) or 0.0
    latest = db.scalar(select(DatasetInfo).order_by(DatasetInfo.created_at.desc()))
    import json
    schema = json.loads(latest.schema_json) if latest else {}
    quality = json.loads(latest.quality_json) if latest else {}
    return {"rows": total, "total_value": float(total_value),
            "dataset": latest.filename if latest else None,
            "schema": schema, "quality": quality}


@router.get("/rows")
def rows(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
         db: Session = Depends(get_db), _: User = Depends(current_user)):
    q = db.query(Transaction).order_by(Transaction.id.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size,
            "items": [{
                "id": t.id, "external_id": t.external_id, "amount": t.amount,
                "category": t.category, "location": t.location,
                "created_at": t.created_at.isoformat(),
            } for t in items]}
