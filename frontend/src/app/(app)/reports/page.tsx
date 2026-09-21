"use client";
import { useState } from "react";
import { api } from "@/lib/api";

async function downloadFile(path: string, filename: string) {
  const res = await api.get(path, { responseType: "blob" });
  const blob = new Blob([res.data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setMsg(null);
    try { await fn(); setMsg("Downloaded: " + key); }
    catch (e: any) { setMsg(e?.response?.data?.detail ?? "Export failed."); }
    finally { setBusy(null); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted text-sm mt-1">
        Generate analytical reports and exports from the ingested dataset.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Transaction CSV Export"
          desc="Up to 5,000 transactions with model probability, risk band and predicted label."
          buttonLabel={busy === "transactions" ? "Generating…" : "Download CSV"}
          disabled={busy !== null}
          onClick={() => run("transactions",
            () => downloadFile("/api/reports/transactions.csv", "transactions.csv"))} />

        <Card title="Fraud Summary CSV"
          desc="Aggregate KPIs, risk-band counts and category breakdown."
          buttonLabel={busy === "summary" ? "Generating…" : "Download CSV"}
          disabled={busy !== null}
          onClick={() => run("summary",
            () => downloadFile("/api/reports/summary.csv", "summary.csv"))} />

        <Card title="Model Performance Report"
          desc="PDF with precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix and model comparison."
          buttonLabel={busy === "model" ? "Generating…" : "Download PDF"}
          disabled={busy !== null}
          onClick={() => run("model",
            () => downloadFile("/api/reports/model-performance.pdf", "model-performance.pdf"))} />

        <Card title="Dataset Quality Report"
          desc="PDF with schema, missing values, duplicates and target detection."
          buttonLabel={busy === "quality" ? "Generating…" : "Download PDF"}
          disabled={busy !== null}
          onClick={() => run("quality",
            () => downloadFile("/api/reports/dataset-quality.pdf", "dataset-quality.pdf"))} />
      </div>

      {msg && <div className="mt-4 text-sm text-emerald-500">{msg}</div>}

      <p className="text-xs text-muted mt-8">
        Reports are generated from the currently ingested dataset. No data is invented.
        Model outputs are review signals, not confirmed fraud.
      </p>
    </div>
  );
}

function Card({ title, desc, buttonLabel, disabled, onClick }: any) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col">
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-muted mt-1 flex-1">{desc}</p>
      <button onClick={onClick} disabled={disabled}
        className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm text-white disabled:opacity-50">
        {buttonLabel}
      </button>
    </div>
  );
}
