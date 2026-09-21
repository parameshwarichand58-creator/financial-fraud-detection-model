# FraudIQ — Zidio Month 2 · Project 2 Submission

**Financial Fraud Detection Model** — an end-to-end fraud detection &
risk analytics platform built for the Zidio Development internship.

---

## 1. Project Summary

An enterprise-style web application that ingests a financial transaction
dataset, trains fraud classification models, exposes transaction-level
predictions with review-risk scoring, and provides analysts with alerts,
case management, explainability, and PDF/CSV reporting.

**Stack:** Next.js 14 + FastAPI + SQLAlchemy + scikit-learn

**Dataset:** the supplied transaction CSV (schema auto-detected on upload)

**Product identity:** FraudIQ — Financial Fraud Detection Model

---

## 2. PRD Requirement → Implementation Map

| PRD Requirement | Implementation | Status |
|---|---|---|
| CSV dataset ingestion | `backend/app/api/routes/datasets.py` → `POST /api/datasets/upload` | ✅ |
| Dataset validation | `backend/app/ml/data_loader.py` → `infer_schema()` | ✅ |
| Data cleaning | `backend/app/ml/feature_engineering.py` → `engineer()` | ✅ |
| EDA | `frontend/src/app/(app)/analytics/page.tsx` | ✅ |
| Feature engineering | `backend/app/ml/feature_engineering.py` | ✅ |
| Model training | `backend/app/ml/trainer.py` → `train_and_persist()` | ✅ |
| Model comparison | trains LogisticRegression + RandomForest in parallel | ✅ |
| Model evaluation | precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix | ✅ |
| Model persistence | `storage/models/*.joblib` via joblib | ✅ |
| Prediction service | `backend/app/ml/predictor.py` | ✅ |
| Review-risk scoring | `backend/app/core.py` → `risk_band()` | ✅ |
| Alerts | `backend/app/api/routes/alerts.py` — auto-created on High/Critical | ✅ |
| Cases | `backend/app/api/routes/cases.py` — status, notes, timeline | ✅ |
| Explainability | `backend/app/ml/explain.py` + `/explain` page | ✅ |
| Interactive dashboard | 13 pages under `frontend/src/app/(app)/` | ✅ |
| CSV export | `/api/reports/transactions.csv`, `/api/reports/summary.csv` | ✅ |
| PDF reports | `/api/reports/model-performance.pdf`, `/api/reports/dataset-quality.pdf` | ✅ |
| Error handling | all routes return structured errors; frontend displays them | ✅ |
| Audit log | `backend/app/models.py` → `AuditLog`; page at `/audit` | ✅ |
| Model limitations documented | `/settings` + `/help` + `README.md` §13 | ✅ |
| No fake metrics | every KPI is computed from the ingested dataset | ✅ |

---

## 3. TRD Requirement → Implementation Map

| TRD Requirement | Implementation | Status |
|---|---|---|
| Python + FastAPI backend | `backend/app/main.py` | ✅ |
| Pydantic schemas | `backend/app/schemas.py` | ✅ |
| SQLAlchemy ORM | `backend/app/models.py` | ✅ |
| PostgreSQL-compatible DB | SQLite for dev; `DATABASE_URL` swappable | ✅ |
| JWT authentication | `backend/app/core.py` (bcrypt + python-jose) | ✅ |
| Structured API errors | FastAPI `HTTPException` with `detail` field | ✅ |
| No external API keys required | entire pipeline runs locally | ✅ |
| Reproducible random seed | `random_state=42` throughout | ✅ |
| Stratified train/test split | `trainer.py` — `train_test_split(stratify=y)` | ✅ |
| Class imbalance handling | `class_weight='balanced'` on both models | ✅ |
| No leakage | preprocessing fitted only on training set | ✅ |
| No SMOTE before split | not applied at all (class weights used instead) | ✅ |
| Model artifact persistence | joblib `.joblib` files + `ModelVersion` table | ✅ |
| Never retrain on dashboard nav | artifacts loaded once per request from disk cache | ✅ |
| Backend pagination | `page` + `page_size` params on all list endpoints | ✅ |
| Frontend (Next.js + TS + Tailwind) | `frontend/` | ✅ |
| Dark / Light / System themes | `frontend/src/lib/theme.ts` | ✅ |
| i18n — English / Hindi / Kannada | `frontend/src/lib/i18n.ts` | ✅ |
| Command palette (Ctrl+K) | `frontend/src/components/CommandPalette.tsx` | ✅ |
| Responsive UI | Tailwind responsive classes throughout | ✅ |
| Environment variables | `backend/.env` + `frontend/.env.local` | ✅ |
| No secrets committed | `.gitignore` excludes `.env`, `*.db`, `storage/*` | ✅ |
| Responsible ML language | "Review Risk" / "Fraud Signal" used everywhere | ✅ |

---

## 4. ML Pipeline Summary

    Dataset
       ↓
    Schema detection       infer_schema()      — no field is invented
       ↓
    Feature engineering    timestamp → hour/dayofweek, amount → log1p
       ↓
    Stratified 80/20 split
       ↓
    Preprocessing pipeline ColumnTransformer — impute, scale, one-hot
       ↓
    Class-imbalance handling   class_weight='balanced'
       ↓
    Training               LogisticRegression + RandomForest
       ↓
    Evaluation             precision, recall, F1, ROC-AUC, PR-AUC, CM
       ↓
    Selection              highest F1 on held-out test set
       ↓
    Persistence            {pipeline, features} → joblib
       ↓
    Scoring                predict_proba over the full dataset
       ↓
    Risk banding           Low / Medium / High / Critical

---

## 5. Dashboard Pages

| # | Page | Purpose |
|---|---|---|
| 1 | Overview | KPIs, risk distribution, system status |
| 2 | Fraud Analytics | Category, location, amount distributions |
| 3 | Transactions | Searchable, filterable, paginated list |
| 4 | Transaction Detail | Model output + features + actions |
| 5 | Alerts | Auto-generated review alerts |
| 6 | Cases | Analyst investigation workflow with timeline |
| 7 | Model Performance | Metrics + confusion matrix + model comparison |
| 8 | Explain AI | Feature importance |
| 9 | Data Explorer | Upload, schema, dataset preview, Reset button |
| 10 | Reports | CSV + PDF exports |
| 11 | Model Registry | Version history and activation |
| 12 | Audit Log | All actions recorded |
| 13 | Settings | Theme, language, thresholds, model limitations |
| 14 | Help | Explanations of every concept |

---

## 6. Running the Platform

### Backend

    cd backend
    python -m venv .venv
    .venv\Scripts\activate
    python -m pip install -r requirements.txt
    python -m uvicorn app.main:app --reload --port 8000

### Frontend

    cd frontend
    npm install
    npm run dev

### Open

    http://localhost:3000

### Demo credentials

    Email:    demo@fraudiq.io
    Password: demo12345

The demo account is auto-seeded on every backend start.

---

## 7. Sample Data

Two CSVs are provided in the project root:

| File | Rows | Fraud rate | Purpose |
|---|---|---|---|
| `sample_transactions.csv` | 20,000 | ~3% | Basic 6-column schema |
| `zidio_transactions.csv` | 10,000 | 5.79% | Richer 9-column schema with realistic fraud signals |

The `zidio_transactions.csv` schema matches typical banking transaction data:

- `transaction_id` — identifier
- `transaction_date` — timestamp
- `transaction_type` — categorical (Payment / Transfer / Withdrawal)
- `amount` — numeric
- `location` — categorical (city)
- `customer_age`, `account_age_days`, `previous_transaction_count` — numeric
- `is_fraud` — target (0/1)

---

## 8. Model Limitations

- Predictions are **review signals**, not confirmed fraud
- False positives and false negatives are possible
- Historical patterns may not generalise to future fraud behaviour
- Model quality depends on the representativeness of the training data
- Probability is a model output, not a calibrated probability of criminal fraud
- This prototype does not represent production banking infrastructure

The platform never claims a transaction is fraudulent, never freezes
accounts, and never makes legal decisions.

---

## 9. Repository Structure

    fraudiq/
    ├── backend/          FastAPI + SQLAlchemy + ML
    ├── frontend/         Next.js 14 + TypeScript + Tailwind
    ├── screenshots/      UI evidence
    ├── sample_transactions.csv
    ├── zidio_transactions.csv
    ├── gen_sample.py
    ├── gen_zidio_sample.py
    ├── README.md
    └── SUBMISSION.md     this file

---

## 10. Verified End-to-End

Every step of the workflow has been manually tested:

- [x] Register a new user
- [x] Sign in with JWT
- [x] Upload a CSV dataset
- [x] Schema auto-detected (numeric / categorical / datetime / target)
- [x] Model trains (Logistic Regression + Random Forest)
- [x] Metrics computed (precision, recall, F1, ROC-AUC, PR-AUC, CM)
- [x] Best model persisted as `.joblib`
- [x] Predictions and risk bands stored
- [x] Alerts auto-generated for High and Critical
- [x] Transaction list, filters, pagination all work
- [x] Transaction detail displays model output
- [x] Create case from transaction detail
- [x] Add note to case, change case status
- [x] Acknowledge and resolve alerts
- [x] Feature importance shown on Explain AI page
- [x] Model Performance page loads active model metrics
- [x] Reports download (CSV + PDF)
- [x] Audit log records every action
- [x] Settings switches theme + language
- [x] Reset Dataset wipes everything cleanly
- [x] Backend restart wipes DB (ephemeral mode) and re-seeds demo user

---

**Submitted by:** Parameshwari Chand
**Built for:** Zidio Development · Month 2 · Project 2
