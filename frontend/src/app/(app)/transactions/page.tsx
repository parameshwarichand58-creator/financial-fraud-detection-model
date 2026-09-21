"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtNum, fmtMoney } from "@/lib/format";

const bandColor: Record<string, string> = {
  Low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  High: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  Critical: "bg-red-500/20 text-red-500 border-red-500/40",
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [band, setBand] = useState("");
  const [q, setQ] = useState("");
  const pageSize = 25;

  useEffect(() => {
    api.get("/api/transactions", {
      params: { page, page_size: pageSize, risk_band: band || undefined },
    }).then((r) => { setRows(r.data.items); setTotal(r.data.total); });
  }, [page, band]);

  const visible = q
    ? rows.filter((r) =>
        (r.external_id ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (r.category ?? "").toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div>
      <h1 className="text-2xl font-bold">Transaction Investigation</h1>
      <p className="text-muted text-sm mt-1">Search, filter and inspect transaction-level model output.</p>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search Txn ID or category…"
          className="bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm w-64 outline-none focus:border-accent/50" />
        <select value={band} onChange={(e) => { setBand(e.target.value); setPage(1); }}
          className="bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All risk bands</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <div className="text-sm text-muted">{fmtNum(total)} transactions</div>
      </div>

      <div className="mt-4 bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-fg/[0.03] text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Txn ID</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-right px-4 py-3">Probability</th>
              <th className="text-left px-4 py-3">Risk</th>
              <th className="text-left px-4 py-3">Prediction</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-fg/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/transactions/${r.id}`} className="text-indigo-500 hover:underline">
                    {r.external_id ?? `TX-${r.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono">{fmtMoney(r.amount)}</td>
                <td className="px-4 py-3">{r.category ?? "—"}</td>
                <td className="px-4 py-3">{r.location ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{r.probability?.toFixed(3)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${bandColor[r.risk_band] ?? ""}`}>
                    {r.risk_band}
                  </span>
                </td>
                <td className="px-4 py-3">{r.label === 1 ? "Fraud signal" : "Legitimate"}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted">
                {rows.length === 0 ? "No transactions yet. Upload a dataset to populate this view." : "No matching results."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40">← Previous</button>
        <div className="text-sm text-muted">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
        <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}
