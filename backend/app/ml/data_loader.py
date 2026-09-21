from __future__ import annotations
import pandas as pd

TARGET_CANDIDATES = [
    "is_fraud", "isfraud", "fraud", "is_fraudulent",
    "class", "label", "target", "fraudulent",
]


def detect_target(df: pd.DataFrame) -> str | None:
    for c in df.columns:
        if c.lower() in TARGET_CANDIDATES:
            return c
    return None


def infer_schema(df: pd.DataFrame) -> dict:
    return {
        "rows": int(df.shape[0]),
        "cols": int(df.shape[1]),
        "missing": int(df.isna().sum().sum()),
        "duplicates": int(df.duplicated().sum()),
        "numeric_fields": df.select_dtypes(include="number").columns.tolist(),
        "categorical_fields": df.select_dtypes(include=["object", "category", "bool"]).columns.tolist(),
        "datetime_fields": [c for c in df.columns if "date" in c.lower() or "time" in c.lower()],
        "target": detect_target(df),
        "columns": df.columns.tolist(),
    }
