"""Load saved model artifacts and score single rows."""
from __future__ import annotations
import joblib
import pandas as pd
from pathlib import Path


_cache: dict[str, dict] = {}


def load_bundle(artifact_path: str) -> dict:
    p = str(Path(artifact_path).resolve())
    if p not in _cache:
        _cache[p] = joblib.load(p)
    return _cache[p]


def score(bundle: dict, row: dict) -> tuple[int, float]:
    pipeline = bundle["pipeline"]
    features = bundle["features"]
    df = pd.DataFrame([{f: row.get(f) for f in features}])
    prob = float(pipeline.predict_proba(df)[0, 1])
    return int(prob >= 0.5), prob
