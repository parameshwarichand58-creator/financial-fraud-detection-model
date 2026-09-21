"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const statusColor: Record<string, string> = {
  Open: "bg-slate-500/15 text-slate-400",
  Investigating: "bg-amber-500/15 text-amber-500",
  "Pending Review": "bg-indigo-500/15 text-indigo-400",
  Resolved: "bg-emerald-500/15 text-emerald-500",
  Closed: "bg-fg/[0.08] text-muted",
};

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    api.get("/api/cases", { params: { status: status || undefined } })
      .then((r) => setCases(r.data.items));
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Case Management</h1>
      <p className="text-muted text-sm mt-1">Track investigation cases from open to resolution.</p>

      <div className="mt-6">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {cases.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center text-muted">
            No investigation cases yet.
          </div>
        )}
        {cases.map((c) => (
          <Link key={c.id} href={`/cases/${c.id}`}
            className="block bg-surface border border-border rounded-2xl p-4 hover:border-accent/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-medium">CS-{c.id} · {c.title}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status] ?? ""}`}>{c.status}</span>
            </div>
            <div className="text-sm text-muted mt-2 line-clamp-1">{c.description ?? "—"}</div>
            <div className="text-xs text-muted mt-2">
              Priority: {c.priority} · Updated {new Date(c.updated_at).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
