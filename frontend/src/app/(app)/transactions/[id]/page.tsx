"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";

export default function TransactionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/transactions/${id}`).then((r) => setTx(r.data)).catch(() => setTx(null));
  }, [id]);

  const createCase = async () => {
    if (!confirm("Create a case for this transaction?")) return;
    setBusy(true);
    try {
      const r = await api.post("/api/cases", {
        title: `Investigate transaction ${tx?.external_id ?? id}`,
        priority: "high", transaction_id: Number(id),
        description: "Auto-created from transaction detail page.",
      });
      router.push(`/cases/${r.data.id}`);
    } catch { setMsg("Could not create case."); }
    finally { setBusy(false); }
  };

  if (!tx) return <div className="text-muted">Loading…</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-fg">← Back</button>
      <h1 className="text-2xl font-bold mt-2">{tx.external_id ?? `TX-${tx.id}`}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface border border-border rounded-2xl p-5 md:col-span-2">
          <div className="text-sm font-semibold mb-3">Transaction Information</div>
          <div className="space-y-2 text-sm">
            <Row label="Amount" value={fmtMoney(tx.amount)} />
            <Row label="Category" value={tx.category ?? "—"} />
            <Row label="Location" value={tx.location ?? "—"} />
            <Row label="Probability" value={tx.probability != null ? tx.probability.toFixed(4) : "—"} />
            <Row label="Risk Band" value={tx.risk_band ?? "—"} />
            <Row label="Prediction" value={tx.label === 1 ? "Fraud signal" : "Legitimate"} />
            {tx.model_algorithm && <Row label="Model" value={tx.model_algorithm} />}
          </div>

          {tx.feature_names?.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">Model Features</div>
              <div className="flex flex-wrap gap-2">
                {tx.feature_names.map((f: string) => (
                  <span key={f} className="text-xs px-2 py-1 rounded bg-fg/[0.05] font-mono">{f}</span>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-3">
                Model contribution — not proof of fraud.
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Analyst Actions</div>
          <div className="space-y-2">
            <button disabled={busy} onClick={createCase}
              className="w-full py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-medium text-white">
              Create Case
            </button>
          </div>
          {msg && <div className="text-xs text-amber-500 mt-3">{msg}</div>}
          <p className="text-[11px] text-muted mt-3">
            Model output is a review signal, not confirmed fraud.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
