import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import current_user
from app.ml.explain import global_importance
from app.ml.predictor import load_bundle
from app.models import AuditLog, ModelVersion, User

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
def list_models(db: Session = Depends(get_db), _: User = Depends(current_user)):
    rows = db.scalars(select(ModelVersion).order_by(desc(ModelVersion.created_at))).all()
    return [{
        "id": m.id, "name": m.name, "algorithm": m.algorithm, "version": m.version,
        "is_active": m.is_active,
        "metrics": json.loads(m.metrics_json or "{}"),
        "all_metrics": json.loads(m.all_metrics_json or "{}"),
        "features": json.loads(m.feature_names_json or "[]"),
        "created_at": m.created_at.isoformat(),
    } for m in rows]


@router.get("/active/explain")
def explain_active(top_n: int = 20, db: Session = Depends(get_db), _: User = Depends(current_user)):
    m = db.scalar(select(ModelVersion).where(ModelVersion.is_active.is_(True)))
    if not m:
        raise HTTPException(404, "No active model")
    features = json.loads(m.feature_names_json or "[]")
    try:
        bundle = load_bundle(m.artifact_path)
        rows = global_importance(bundle["pipeline"], features, top_n=top_n)
        source = "model"
    except Exception:
        rows, source = [], "unavailable"
    return {"model_version": m.version, "algorithm": m.algorithm,
            "source": source, "features": features, "importance": rows}


@router.post("/{mid}/activate")
def activate(mid: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    db.query(ModelVersion).update({ModelVersion.is_active: False})
    m = db.get(ModelVersion, mid)
    if not m: raise HTTPException(404, "Model not found")
    m.is_active = True
    db.add(AuditLog(user_id=u.id, action="model_activate", entity="model_version", entity_id=str(mid)))
    db.commit()
    return {"ok": True, "active": mid}
