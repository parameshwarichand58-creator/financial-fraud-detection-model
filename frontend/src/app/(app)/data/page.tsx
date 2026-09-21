"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export default function DataPage() {
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.get("/api/data/summary").then((r) => setSummary(r.data)).catch(() => {});
    api.get("/api/data/rows", { params: { page: 1, page_size: 25 } })
      .then((r) => setRows(r.data.items));
  };
  useEffect(() => { load(); }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("Uploading and training — this may take 30–60s…");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/api/datasets/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(
        "Ingested " + r.data.rows_ingested + " transactions · Model: " +
        r.data.model.name + " (" + r.data.model.algorithm + ") · Alerts: " +
        r.data.alerts_created
      );
      load();
    } catch (e: any) {
      setMsg(e?.response?.data?.detail ?? "Upload failed.");
    } finally { setBusy(false); }
  };

  const reset = async () => {
    if (!confirm("Reset the platform? This will delete all transactions, alerts, cases and the trained model.")) return;
    setResetting(true); setMsg(null);
    try {
      await api.post("/api/datasets/reset");
      setMsg("Platform reset. Upload a dataset to begin.");
      setSummary(null); setRows([]);
      load();
    } catch {
      setMsg("Could not reset.");
    } finally { setResetting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Data Explorer</h1>
      <p className="text-muted text-sm mt-1">Upload a dataset to populate the platform.</p>

      <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
        <div className="text-sm font-semibold mb-3">Upload Dataset</div>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <button onClick={upload} disabled={busy || resetting}
            className="px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm text-white disabled:opacity-50">
            {busy ? "Processing…" : "Upload & Train"}
          </button>
          <button onClick={reset} disabled={busy || resetting}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:border-rose-500/50 hover:text-rose-500 disabled:opacity-50">
            {resetting ? "Resetting…" : "Reset Dataset"}
          </button>
        </div>
        {msg && <div className="text-xs text-emerald-500 mt-3">{msg}</div>}
        <p className="text-[11px] text-muted mt-2">
          Uploading a new CSV replaces the previous dataset. Detection is a review signal — not confirmed fraud.
        </p>
      </div>

      {summary && summary.rows > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Stat label="Rows Ingested" value={(summary.rows ?? 0).toLocaleString()} />
            <Stat label="Total Value" value={"$" + (summary.total_value ?? 0).toLocaleString()} />
            <Stat label="Dataset" value={summary.dataset ?? "—"} />
            <Stat label="Schema Columns" value={(summary.schema?.cols ?? 0).toString()} />
          </div>

          {summary.schema && (
            <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
              <div className="text-sm font-semibold mb-3">Detected Schema</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted mb-1">Numeric</div>
                  <div className="font-mono text-xs">{(summary.schema.numeric_fields ?? []).join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted mb-1">Categorical</div>
                  <div className="font-mono text-xs">{(summary.schema.categorical_fields ?? []).join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted mb-1">Datetime</div>
                  <div className="font-mono text-xs">{(summary.schema.datetime_fields ?? []).join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted mb-1">Target</div>
                  <div className="font-mono text-xs">{summary.schema.target ?? "—"}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-fg/[0.03] text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{r.external_id ?? "TX-" + r.id}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.amount != null ? "$" + r.amount.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">{r.category ?? "—"}</td>
                    <td className="px-4 py-3">{r.location ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(!summary || summary.rows === 0) && (
        <div className="mt-6 bg-surface border border-border rounded-2xl p-12 text-center text-muted">
          No dataset loaded. Upload a CSV to begin.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-xl font-bold mt-2 truncate">{value}</div>
    </div>
  );
}
