from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import get_settings, wipe_state, seed_demo_user

settings = get_settings()

# --- Ephemeral mode: wipe DB + storage BEFORE any DB engine is created ---
if settings.EPHEMERAL_MODE:
    wipe_state()
    print(">> Ephemeral mode: previous state wiped")

from app.api.routes import (  # noqa: E402
    alerts, audit, auth, cases, dashboard, data, datasets, health, models, reports, transactions,
)
from app.db import Base, engine  # noqa: E402
from app import models as _models  # noqa: E402, F401

app = FastAPI(title="FraudIQ API", version="0.2.0",
              description="Financial Fraud Risk Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# --- Seed the demo user right after tables are created ---
seed_demo_user()

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(datasets.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(cases.router)
app.include_router(models.router)
app.include_router(data.router)
app.include_router(audit.router)
app.include_router(reports.router)
