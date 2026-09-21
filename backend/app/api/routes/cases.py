from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.models import AuditLog, Case, CaseEvent, User
from app.schemas import CaseCreate, CaseEventOut, CaseNoteIn, CaseOut, CasePatch

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("")
def list_cases(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
               status: str | None = None,
               db: Session = Depends(get_db), _: User = Depends(current_user)):
    q = db.query(Case)
    if status: q = q.filter(Case.status == status)
    q = q.order_by(desc(Case.updated_at))
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size,
            "items": [CaseOut.model_validate(c) for c in items]}


@router.post("", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    c = Case(title=payload.title, description=payload.description,
             priority=payload.priority, transaction_id=payload.transaction_id, created_by=u.id)
    db.add(c); db.commit(); db.refresh(c)
    db.add(CaseEvent(case_id=c.id, user_id=u.id, event_type="created",
                     message=f"Case {c.id} created"))
    db.add(AuditLog(user_id=u.id, action="case_create", entity="case", entity_id=str(c.id)))
    db.commit()
    return c


@router.get("/{cid}", response_model=CaseOut)
def get_case(cid: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    c = db.get(Case, cid)
    if not c: raise HTTPException(404, "Case not found")
    return c


@router.patch("/{cid}", response_model=CaseOut)
def patch_case(cid: int, payload: CasePatch, db: Session = Depends(get_db), u: User = Depends(current_user)):
    c = db.get(Case, cid)
    if not c: raise HTTPException(404, "Case not found")
    if payload.status:
        prev = c.status; c.status = payload.status
        db.add(CaseEvent(case_id=c.id, user_id=u.id, event_type="status",
                         message=f"Status: {prev} to {payload.status}"))
    if payload.priority: c.priority = payload.priority
    if payload.assigned_to is not None: c.assigned_to = payload.assigned_to
    db.add(AuditLog(user_id=u.id, action="case_patch", entity="case", entity_id=str(cid)))
    db.commit(); db.refresh(c); return c


@router.post("/{cid}/notes", response_model=CaseEventOut)
def add_note(cid: int, payload: CaseNoteIn, db: Session = Depends(get_db), u: User = Depends(current_user)):
    c = db.get(Case, cid)
    if not c: raise HTTPException(404, "Case not found")
    ev = CaseEvent(case_id=cid, user_id=u.id, event_type="note", message=payload.message)
    db.add(ev); db.commit(); db.refresh(ev); return ev


@router.get("/{cid}/timeline")
def timeline(cid: int, db: Session = Depends(get_db), _: User = Depends(current_user)):
    events = db.query(CaseEvent).filter(CaseEvent.case_id == cid).order_by(
        desc(CaseEvent.created_at)).all()
    return [CaseEventOut.model_validate(e) for e in events]
