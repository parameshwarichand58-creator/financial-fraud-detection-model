"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api.get("/api/transactions", { params: { page: 1, page_size: 200 } })
      .then((r) => setRows(r.data.items));
  }, []);

  const byBand: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  rows.forEach((r) => {
    byBand[r.risk_band] = (byBand[r.risk_band] ?? 0) + 1;
    if (r.category) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    if (r.location) byLocation[r.location] = (byLocation[r.location] ?? 0) + 1;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Fraud Analytics</h1>
      <p className="text-muted text-sm mt-1">
        Interactive fraud pattern exploration. Showing top 200 transactions by probability.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Panel title="Risk Band Distribution">
          <SimpleBars data={byBand} />
        </Panel>
        <Panel title="Transactions by Category">
          <SimpleBars data={byCategory} />
        </Panel>
        <Panel title="Transactions by Location">
          <SimpleBars data={byLocation} />
        </Panel>
        <Panel title="Amount Distribution (top 5)">
          <SimpleBars data={
            rows.slice(0, 5).reduce((acc, r) => {
              const key = r.external_id ?? `TX-${r.id}`;
              acc[key] = r.amount ?? 0;
              return acc;
            }, {} as Record<string, number>)
          } />
        </Panel>
      </div>

      {rows.length === 0 && (
        <div className="mt-6 bg-surface border border-border rounded-2xl p-12 text-center text-muted">
          No data yet. Upload a dataset in Data Explorer.
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

function SimpleBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0) return <div className="text-muted text-sm">No data</div>;
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted truncate">{k}</span>
            <span className="font-mono">{v.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-fg/[0.05] overflow-hidden">
            <div className="h-full bg-accent rounded-full"
                 style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
