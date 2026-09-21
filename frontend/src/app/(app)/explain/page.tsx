"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ExplainPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/models/active/explain")
      .then((r) => setData(r.data))
      .catch(() => setErr("No active model available"));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Explainable AI</h1>
      <p className="text-muted text-sm mt-1">
        Understand which features influence model behaviour. These explain the model —
        they do not prove fraud.
      </p>

      {err && (
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl p-4 text-sm">
          {err}
        </div>
      )}

      {data && (
        <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-muted">Active Model</div>
          <div className="text-sm mt-1">
            {data.algorithm} · v{data.model_version} · source: {data.source}
          </div>

          {data.importance?.length > 0 ? (
            <div className="mt-6 space-y-3">
              {data.importance.map((row: any, i: number) => {
                const max = Math.max(...data.importance.map((r: any) => r.importance));
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-muted">{row.feature}</span>
                      <span className="font-mono">{row.importance.toFixed(4)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-fg/[0.05] overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full"
                           style={{ width: `${(row.importance / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 text-sm text-muted">
              Feature importance not available for this model type.
            </div>
          )}

          <p className="text-[11px] text-muted mt-6">
            Explanation describes model behaviour; it does not prove fraud or establish causation.
          </p>
        </div>
      )}
    </div>
  );
}
