from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import Alert, AuditLog, User
from app.schemas import AlertOut, AlertPatch

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(current_user),
):
    q = db.query(Alert)
    if status: q = q.filter(Alert.status == status)
    if severity: q = q.filter(Alert.severity == severity)
    q = q.order_by(desc(Alert.created_at))
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size,
            "items": [AlertOut.model_validate(a) for a in items]}


@router.get("/stats")
def stats(db: Session = Depends(get_db), _: User = Depends(current_user)):
    rows = db.execute(select(Alert.status, func.count(Alert.id)).group_by(Alert.status)).all()
    return {"by_status": {r[0]: r[1] for r in rows}}


def _set(db: Session, aid: int, status: str, uid: int) -> Alert:
    a = db.get(Alert, aid)
    if not a: raise HTTPException(404, "Alert not found")
    a.status = status
    db.add(AuditLog(user_id=uid, action=f"alert_{status}", entity="alert", entity_id=str(aid)))
    db.commit(); db.refresh(a)
    return a


@router.patch("/{aid}", response_model=AlertOut)
def patch_alert(aid: int, body: AlertPatch, db: Session = Depends(get_db), u: User = Depends(current_user)):
    a = db.get(Alert, aid)
    if not a: raise HTTPException(404, "Alert not found")
    if body.status: a.status = body.status
    if body.assigned_to is not None: a.assigned_to = body.assigned_to
    db.add(AuditLog(user_id=u.id, action="alert_patch", entity="alert", entity_id=str(aid)))
    db.commit(); db.refresh(a); return a


@router.post("/{aid}/acknowledge", response_model=AlertOut)
def ack(aid: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    return _set(db, aid, "acknowledged", u.id)


@router.post("/{aid}/resolve", response_model=AlertOut)
def resolve(aid: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    return _set(db, aid, "resolved", u.id)


@router.post("/{aid}/dismiss", response_model=AlertOut)
def dismiss(aid: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    return _set(db, aid, "dismissed", u.id)
