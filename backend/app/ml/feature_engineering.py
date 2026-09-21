from __future__ import annotations
import math
import pandas as pd


def engineer(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in list(out.columns):
        low = col.lower()
        if "date" in low or "time" in low:
            try:
                parsed = pd.to_datetime(out[col], errors="coerce")
                out[f"{col}__hour"] = parsed.dt.hour
                out[f"{col}__dayofweek"] = parsed.dt.dayofweek
            except Exception:
                pass
    for col in list(out.columns):
        if col.lower() in {"amount", "amt", "transaction_amount", "value"}:
            try:
                v = pd.to_numeric(out[col], errors="coerce").clip(lower=0)
                out[f"{col}__log"] = v.apply(lambda x: 0.0 if pd.isna(x) else math.log1p(x))
            except Exception:
                pass
    return out
