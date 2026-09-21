# FraudIQ — Financial Fraud Risk Intelligence Platform

An end-to-end fraud detection & risk analytics platform for financial transaction data.
Built for the **Zidio Development · Month 2 · Project 2** internship.

> **Model predictions are review signals, not confirmed fraud.** Every flagged
> transaction is intended for analyst review. The platform never claims a
> transaction is fraudulent and never takes automated action on accounts.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Features](#3-features)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Getting Started](#6-getting-started)
7. [Dataset Setup](#7-dataset-setup)
8. [ML Pipeline](#8-ml-pipeline)
9. [Model Evaluation](#9-model-evaluation)
10. [API Reference](#10-api-reference)
11. [Environment Variables](#11-environment-variables)
12. [Responsible ML](#12-responsible-ml)
13. [Model Limitations](#13-model-limitations)
14. [Future Scope](#14-future-scope)

---

## 1. Overview

FraudIQ ingests a financial transaction CSV, validates its schema, engineers
features, trains classification models, evaluates them on fraud-appropriate
metrics, and exposes everything through a premium web dashboard for analysts.

Workflow:

    DATA → VALIDATION → PREPROCESSING → FEATURE ENGINEERING
        → TRAINING → EVALUATION → PERSISTENCE → PREDICTION
        → RISK SCORING → ALERTS → INVESTIGATION → CASES → REPORTS

---

## 2. Architecture

    ┌──────────────────────┐
    │  Transaction CSV     │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  Schema detection    │  infer_schema() — no field is invented
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  Feature engineering │  time-derived, log-amount, encodings
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  Train / Evaluate    │  LogisticRegression + RandomForest
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  Persisted artifact  │  joblib — loaded at inference, never retrained
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  FastAPI backend     │  JWT auth, SQLAlchemy, SQLite (Postgres-ready)
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │  Next.js frontend    │  Enterprise dark UI, i18n, command palette
    └──────────────────────┘

---

## 3. Features

**Data pipeline**
- CSV upload with schema detection (numeric / categorical / datetime / target)
- Missing-value and duplicate reporting
- Reproducible preprocessing pipeline (fitted on train, applied to test)
- No target leakage, no SMOTE-before-split

**Machine learning**
- Logistic Regression + Random Forest trained per dataset
- Metrics: Precision, Recall, F1, ROC-AUC, PR-AUC, confusion matrix
- Automatic selection by F1 (not accuracy — fraud data is imbalanced)
- Artifacts persisted with Joblib; loaded for inference, never retrained per request

**Risk engine**
- Probability → review band (Low / Medium / High / Critical)
- Thresholds configurable via environment
- Language: "Review Risk", "Fraud Signal" — never "Confirmed Fraud"

**Analyst workflow**
- Transaction investigation with search, filter, pagination
- Detail page with model output + top features + disclaimer
- Auto-generated alerts for High / Critical bands
- Case management: create, assign, prioritise, add notes, timeline, status
- Audit log of every meaningful action
- CSV and PDF reports

**Platform**
- JWT auth, protected routes, salted password hashing (bcrypt)
- Dark / Light / System themes with persisted preference
- i18n: English / Hindi / Kannada
- Command palette (Ctrl/Cmd + K)
- Ephemeral dataset mode — the platform is empty until a CSV is uploaded
- Manual "Reset Dataset" button in Data Explorer

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic, SQLAlchemy 2, Uvicorn |
| Database | SQLite (dev) — PostgreSQL-compatible via DATABASE_URL |
| ML | scikit-learn, pandas, numpy, joblib |
| Reports | reportlab (PDF), built-in CSV |
| Auth | python-jose (JWT), bcrypt |

No external API keys are required. Everything runs locally.

---

## 5. Project Structure

    fraudiq/
    ├── backend/
    │   ├── app/
    │   │   ├── main.py              FastAPI entrypoint
    │   │   ├── core.py              settings, security, risk bands
    │   │   ├── db.py                SQLAlchemy engine + session
    │   │   ├── models.py            User, Transaction, Prediction,
    │   │   │                        ModelVersion, Alert, Case, CaseEvent,
    │   │   │                        AuditLog, Report, DatasetInfo
    │   │   ├── schemas.py           Pydantic request/response schemas
    │   │   ├── deps.py              get_current_user dependency
    │   │   ├── ml/
    │   │   │   ├── data_loader.py       schema detection
    │   │   │   ├── feature_engineering.py
    │   │   │   ├── preprocessing.py     ColumnTransformer pipeline
    │   │   │   ├── trainer.py           train + evaluate + persist
    │   │   │   ├── predictor.py         load artifact + score
    │   │   │   └── explain.py           feature importance
    │   │   └── api/routes/
    │   │       ├── auth.py  dashboard.py  transactions.py
    │   │       ├── datasets.py  alerts.py  cases.py
    │   │       ├── models.py  data.py  audit.py
    │   │       ├── reports.py  health.py
    │   ├── storage/models/          persisted .joblib artifacts
    │   ├── storage/uploads/         raw uploaded CSVs
    │   ├── requirements.txt
    │   └── .env
    ├── frontend/
    │   ├── src/
    │   │   ├── app/                 Next.js App Router pages
    │   │   ├── components/          Sidebar, Topbar, CommandPalette, KPI
    │   │   └── lib/                 api, auth, theme, i18n, format
    │   ├── package.json
    │   └── .env.local
    ├── sample_transactions.csv
    ├── gen_sample.py
    └── README.md

---

## 6. Getting Started

### Backend

    cd backend
    python -m venv .venv
    .venv\Scripts\activate           # Windows
    # source .venv/bin/activate      # macOS / Linux
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Expected output:

    >> Ephemeral mode: previous state wiped
    >> Demo user seeded: demo@fraudiq.io / demo12345
    INFO:     Application startup complete.

### Frontend

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000

### Demo credentials

    Email:    demo@fraudiq.io
    Password: demo12345

---

## 7. Dataset Setup

The platform is schema-driven. It never assumes column names.

Upload via **Data Explorer** in the UI, or via API:

    curl -X POST http://localhost:8000/api/datasets/upload \
      -H "Authorization: Bearer <token>" \
      -F "file=@sample_transactions.csv"

### Sample dataset

    python gen_sample.py

Generates `sample_transactions.csv` with 20,000 synthetic rows:

| Column | Type | Role |
|---|---|---|
| transaction_id | string | identifier |
| amount | float | numeric feature |
| transaction_type | string | categorical feature |
| location | string | categorical feature |
| timestamp | datetime | time-derived features |
| is_fraud | int (0/1) | target |

The platform adapts to any CSV with a recognisable target column
(`is_fraud`, `fraud`, `class`, `label`, `target`, ...). If no target exists,
a placeholder label is generated so the pipeline remains executable — clearly
marked as demo behaviour.

---

## 8. ML Pipeline

1. **Schema detection** — infers numeric, categorical, datetime, target columns
2. **Feature engineering** — timestamp → hour/dayofweek; amount → log-transform
3. **Stratified 80/20 split** — no leakage; preprocessing fitted only on train
4. **Preprocessing pipeline** — impute + scale numeric; impute + one-hot categorical
5. **Class imbalance** — `class_weight="balanced"` on both models
6. **Training** — LogisticRegression and RandomForest in parallel
7. **Evaluation** — precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix
8. **Selection** — highest F1 on the held-out test set
9. **Scoring** — best model scores the full dataset; bands assigned
10. **Persistence** — `{pipeline, features}` written to `storage/models/*.joblib`

---

## 9. Model Evaluation

Fraud datasets are highly imbalanced — a "always predict legitimate" classifier
would reach 98% accuracy while catching zero fraud. **Accuracy is therefore not
the primary metric.**

| Metric | What it measures |
|---|---|
| Precision | Of flagged transactions, how many are truly fraud |
| Recall | Of actual fraud, how many were caught |
| F1 | Balance between precision and recall |
| ROC-AUC | Discrimination across thresholds |
| PR-AUC | Better than ROC-AUC when positives are rare |
| Confusion Matrix | TP / TN / FP / FN breakdown |

The Model Performance page and the Model Performance PDF report display all of
these. The active model is not chosen because it has the highest accuracy.

---

## 10. API Reference

Full interactive documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc

Highlights:

    POST  /api/auth/register            create account
    POST  /api/auth/login               obtain JWT
    GET   /api/auth/me                  current user

    GET   /api/dashboard/summary        KPIs for Overview
    GET   /api/transactions             paginated + filterable
    GET   /api/transactions/{id}        transaction detail
    POST  /api/datasets/upload          ingest + train
    POST  /api/datasets/reset           wipe dataset & model

    GET   /api/alerts                   list, filter
    POST  /api/alerts/{id}/acknowledge  acknowledge
    POST  /api/alerts/{id}/resolve      resolve

    GET   /api/cases                    list
    POST  /api/cases                    create
    PATCH /api/cases/{id}               update status
    POST  /api/cases/{id}/notes         add note
    GET   /api/cases/{id}/timeline      events

    GET   /api/models                   registry
    GET   /api/models/active/explain    feature importance
    POST  /api/models/{id}/activate     activate a version

    GET   /api/data/summary             dataset + schema
    GET   /api/data/rows                paginated rows

    GET   /api/audit                    audit log

    GET   /api/reports/transactions.csv
    GET   /api/reports/summary.csv
    GET   /api/reports/model-performance.pdf
    GET   /api/reports/dataset-quality.pdf

---

## 11. Environment Variables

`backend/.env`:

    DATABASE_URL=sqlite:///./fraudiq.db
    JWT_SECRET=change-me-in-prod
    JWT_ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    MODELS_DIR=./storage/models
    UPLOADS_DIR=./storage/uploads
    REVIEW_THRESHOLD=0.60
    CRITICAL_THRESHOLD=0.85
    EPHEMERAL_MODE=True
    SEED_DEMO_USER=True

`frontend/.env.local`:

    NEXT_PUBLIC_API_URL=http://localhost:8000

**Ephemeral mode** wipes the database, uploaded CSVs, and model artifacts on
every backend start. Set `EPHEMERAL_MODE=False` to persist between restarts.

---

## 12. Responsible ML

This platform is a decision-support prototype, not an automated enforcement
system. It:

- **Never** claims a prediction proves fraud
- **Never** freezes accounts, blocks transactions, or makes legal decisions
- **Never** stores PINs, CVVs, or banking credentials
- **Always** presents outputs as *Review Risk* / *Model Score* / *Fraud Signal*

The Help Center and every prediction surface reinforce this distinction.

---

## 13. Model Limitations

- False positives and false negatives are possible
- Historical patterns may not reflect future fraud behaviour
- Model performance depends heavily on dataset quality and representativeness
- A model trained on one organisation's data should not be assumed to generalise
- Probability is a model output, not a calibrated probability of criminal fraud
- This prototype does not represent production banking infrastructure

---

## 14. Future Scope

- Real-time streaming ingestion (Kafka, webhooks)
- Database migration to PostgreSQL in production
- SHAP-based local explanations per transaction
- Scheduled retraining with drift detection
- Role-based access control (Admin / Analyst / Data / Viewer)
- Notification centre with email/Slack webhooks
- Time-aware splitting for temporal datasets
- Deployment via Docker Compose (frontend + backend + Postgres)

---

## License & Attribution

Built for the Zidio Development Month 2 Project 2 internship.

Dataset credit: any real dataset supplied by Zidio; otherwise the sample
generator produces clearly-labelled synthetic data for demonstration only.
