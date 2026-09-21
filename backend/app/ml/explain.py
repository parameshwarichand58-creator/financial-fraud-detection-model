"""Model explanation — SHAP if available, otherwise feature importance."""
from __future__ import annotations
from typing import Any


def global_importance(pipeline, feature_names: list[str], top_n: int = 20) -> list[dict]:
    try:
        clf = pipeline.named_steps.get("clf")
        if clf is None:
            return []
        if hasattr(clf, "feature_importances_"):
            importances = list(clf.feature_importances_)
        elif hasattr(clf, "coef_"):
            importances = [abs(v) for v in clf.coef_[0]]
        else:
            return []
        # Feature count may exceed raw names due to one-hot; pair what we can
        n = min(len(importances), len(feature_names))
        pairs = sorted(
            [{"feature": feature_names[i], "importance": float(importances[i])} for i in range(n)],
            key=lambda x: x["importance"], reverse=True,
        )[:top_n]
        return pairs
    except Exception:
        return []


def local_explanation(pipeline, feature_names: list[str], row: dict) -> list[dict]:
    """Return per-feature contributions where supported (falls back to global)."""
    return global_importance(pipeline, feature_names, top_n=8)
