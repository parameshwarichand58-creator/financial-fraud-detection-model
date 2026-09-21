from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import AuditLog, User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("")
def list_logs(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
              db: Session = Depends(get_db), _: User = Depends(current_user)):
    q = db.query(AuditLog).order_by(desc(AuditLog.created_at))
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size,
            "items": [{
                "id": l.id, "user_id": l.user_id, "action": l.action,
                "entity": l.entity, "entity_id": l.entity_id, "detail": l.detail,
                "created_at": l.created_at.isoformat(),
            } for l in items]}
