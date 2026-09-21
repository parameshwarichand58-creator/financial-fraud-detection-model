"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  useEffect(() => { api.get("/api/models").then((r) => setModels(r.data)); }, []);
  const active = models.find((m) => m.is_active);

  return (
    <div>
      <h1 className="text-2xl font-bold">Model Performance</h1>
      <p className="text-muted text-sm mt-1">
        Metrics for the active model. Fraud datasets are imbalanced — accuracy is not the primary metric.
      </p>

      {active && (
        <>
          <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-muted">Active Model</div>
            <div className="text-xl font-bold mt-1">{active.name}</div>
            <div className="text-sm text-muted">{active.algorithm} · v{active.version}</div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
              {[
                ["Precision", active.metrics?.precision],
                ["Recall", active.metrics?.recall],
                ["F1", active.metrics?.f1],
                ["ROC-AUC", active.metrics?.roc_auc],
                ["PR-AUC", active.metrics?.pr_auc],
              ].map(([label, v]: any) => (
                <div key={label} className="bg-fg/[0.03] rounded-xl p-4">
                  <div className="text-xs uppercase text-muted tracking-wider">{label}</div>
                  <div className="text-xl font-semibold mt-1">
                    {v != null ? Number(v).toFixed(3) : "—"}
                  </div>
                </div>
              ))}
            </div>

            {active.metrics?.confusion_matrix && (
              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">Confusion Matrix</div>
                <table className="text-xs font-mono">
                  <tbody>
                    {active.metrics.confusion_matrix.map((row: number[], i: number) => (
                      <tr key={i}>
                        {row.map((v, j) => (
                          <td key={j} className="px-3 py-2 bg-fg/[0.04] border border-border">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[11px] text-muted mt-4">
              Accuracy is intentionally not shown: fraud datasets are highly imbalanced.
            </p>
          </div>

          {Object.keys(active.all_metrics ?? {}).length > 1 && (
            <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
              <div className="text-sm font-semibold mb-4">Model Comparison</div>
              <table className="w-full text-sm">
                <thead className="text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2">Model</th>
                    <th className="text-right py-2">Precision</th>
                    <th className="text-right py-2">Recall</th>
                    <th className="text-right py-2">F1</th>
                    <th className="text-right py-2">ROC-AUC</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(active.all_metrics).map(([name, m]: any) => (
                    <tr key={name} className="border-t border-border">
                      <td className="py-2">{name}</td>
                      <td className="py-2 text-right font-mono">{m.precision?.toFixed(3) ?? "—"}</td>
                      <td className="py-2 text-right font-mono">{m.recall?.toFixed(3) ?? "—"}</td>
                      <td className="py-2 text-right font-mono">{m.f1?.toFixed(3) ?? "—"}</td>
                      <td className="py-2 text-right font-mono">{m.roc_auc?.toFixed(3) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!active && (
        <div className="mt-6 bg-surface border border-border rounded-2xl p-12 text-center text-muted">
          No trained model yet. Upload a dataset to train one.
        </div>
      )}
    </div>
  );
}
