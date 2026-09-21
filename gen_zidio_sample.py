import pandas as pd
import numpy as np

rng = np.random.default_rng(2026)
n = 10000

cities = ["Bengaluru","Mumbai","Delhi","Chennai","Hyderabad",
          "Pune","Kolkata","Jaipur","Ahmedabad"]
types = ["Payment","Transfer","Withdrawal"]

customer_age = rng.integers(18, 70, n)
account_age_days = np.clip(rng.gamma(2.5, 400, n).astype(int), 5, 4000)
previous_transaction_count = np.clip(rng.gamma(2, 25, n).astype(int), 0, 300)
transaction_type = rng.choice(types, n, p=[0.55, 0.30, 0.15])
location = rng.choice(cities, n, p=[0.16, 0.15, 0.13, 0.12, 0.11,
                                    0.10, 0.09, 0.08, 0.06])
amount = np.round(rng.lognormal(mean=5.3, sigma=1.1, size=n), 2)

fraud_score = (
    -3.5
    + 0.9 * (amount > 5000)
    + 0.9 * (account_age_days < 180)
    + 0.8 * (previous_transaction_count < 5)
    + 0.7 * (transaction_type == "Transfer")
    + 0.5 * (transaction_type == "Withdrawal")
    + 0.0002 * amount
    + rng.normal(0, 0.7, n)
)
prob = 1 / (1 + np.exp(-fraud_score))
is_fraud = (rng.random(n) < prob).astype(int)

# Timestamps: spread across 30 days with daytime hours
start = pd.Timestamp("2026-01-01")
day_offsets = rng.integers(0, 30, n)
hours = rng.choice(range(8, 23), n)
minutes = rng.integers(0, 60, n)
timestamps = (start
    + pd.to_timedelta(day_offsets, unit="D")
    + pd.to_timedelta(hours, unit="h")
    + pd.to_timedelta(minutes, unit="m"))

df = pd.DataFrame({
    "transaction_id": [f"TXN{i+1:05d}" for i in range(n)],
    "transaction_date": timestamps,
    "transaction_type": transaction_type,
    "amount": amount,
    "location": location,
    "customer_age": customer_age,
    "account_age_days": account_age_days,
    "previous_transaction_count": previous_transaction_count,
    "is_fraud": is_fraud,
}).sort_values("transaction_date").reset_index(drop=True)

df.to_csv("zidio_transactions.csv", index=False)

print(f"Wrote zidio_transactions.csv with {len(df):,} rows")
print(f"Fraud rate: {df['is_fraud'].mean()*100:.2f}%")
print(f"Fraud cases: {df['is_fraud'].sum():,}")
print()
print(df.head().to_string())
