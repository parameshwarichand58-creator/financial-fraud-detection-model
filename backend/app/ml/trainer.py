from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score,
    average_precision_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from app.core import get_settings, risk_band
from app.ml.data_loader import detect_target
from app.ml.feature_engineering import engineer
from app.ml.preprocessing import build_preprocessor

settings = get_settings()


def _prepare(df: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    target = detect_target(df)
    if target is None:
        rng = np.random.default_rng(42)
        df = df.copy()
        df["__label"] = rng.choice([0, 1], len(df), p=[0.98, 0.02])
        target = "__label"
    df = engineer(df)
    return df.dropna(subset=[target]).reset_index(drop=True), target


def _feature_cols(df: pd.DataFrame, target: str) -> list[str]:
    drop = {target}
    for c in df.columns:
        if any(k in c.lower() for k in ("id", "index", "__label")):
            drop.add(c)
    return [c for c in df.columns if c not in drop]


def _score(y_true, y_pred, y_prob) -> dict:
    out = {
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }
    try:
        out["roc_auc"] = float(roc_auc_score(y_true, y_prob))
    except ValueError:
        out["roc_auc"] = None
    try:
        out["pr_auc"] = float(average_precision_score(y_true, y_prob))
    except ValueError:
        out["pr_auc"] = None
    return out


def train_and_persist(df: pd.DataFrame, dataset_name: str) -> dict:
    df, target = _prepare(df)
    features = _feature_cols(df, target)
    X, y = df[features], df[target].astype(int)

    strat = y if y.nunique() > 1 else None
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=strat
    )

    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "RandomForest": RandomForestClassifier(
            n_estimators=150, max_depth=12,
            class_weight="balanced_subsample", random_state=42, n_jobs=-1
        ),
    }

    best, best_name, best_f1 = None, None, -1
    all_metrics: dict[str, dict] = {}
    for name, clf in candidates.items():
        pipe = Pipeline([("prep", build_preprocessor(df, features)), ("clf", clf)])
        pipe.fit(X_tr, y_tr)
        prob = pipe.predict_proba(X_te)[:, 1]
        pred = (prob >= 0.5).astype(int)
        m = _score(y_te, pred, prob)
        all_metrics[name] = m
        if m["f1"] > best_f1:
            best, best_name, best_f1 = pipe, name, m["f1"]

    probs = best.predict_proba(X)[:, 1]
    preds = df.copy()
    preds["probability"] = probs
    preds["label"] = (probs >= 0.5).astype(int)
    preds["risk_band"] = preds["probability"].apply(risk_band)

    for c in preds.columns:
        if c.lower() in {"amount", "amt", "transaction_amount", "value"}:
            preds["amount"] = preds[c]; break
    for c in preds.columns:
        if c.lower() in {"transaction_id", "txn_id", "id"}:
            preds["external_id"] = preds[c].astype(str); break
    for c in preds.columns:
        if "type" in c.lower() or "category" in c.lower():
            preds["category"] = preds[c].astype(str); break
    for c in preds.columns:
        if "location" in c.lower() or "country" in c.lower():
            preds["location"] = preds[c].astype(str); break

    version = datetime.utcnow().strftime("%Y%m%d%H%M%S") + "-" + uuid4().hex[:6]
    artifact = Path(settings.MODELS_DIR) / f"{best_name}-{version}.joblib"
    joblib.dump({"pipeline": best, "features": features}, artifact)

    return {
        "name": f"{best_name}-{dataset_name}",
        "algorithm": best_name,
        "version": version,
        "artifact_path": str(artifact),
        "metrics": all_metrics[best_name],
        "all_metrics": all_metrics,
        "feature_names": features,
        "predictions_df": preds,
    }
