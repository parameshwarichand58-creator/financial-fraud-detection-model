import pandas as pd, numpy as np
rng = np.random.default_rng(7)
n = 20000
df = pd.DataFrame({
  "transaction_id": [f"TXN{i:07d}" for i in range(n)],
  "amount": np.round(rng.lognormal(3, 1.2, n), 2),
  "transaction_type": rng.choice(["Online","POS","ATM","Transfer"], n),
  "location": rng.choice(["NY","CA","TX","FL","IL","WA"], n),
  "timestamp": pd.date_range("2024-01-01", periods=n, freq="15min"),
  "is_fraud": (rng.random(n) < 0.03).astype(int),
})
df.to_csv("sample_transactions.csv", index=False)
print("Wrote sample_transactions.csv")
