"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KPI } from "@/components/KPI";
import { useI18n } from "@/lib/i18n";
import { fmtNum, fmtMoney, fmtPct, fmtDate } from "@/lib/format";
import { Server, Database, Cpu, ShieldCheck } from "lucide-react";

export default function OverviewPage() {
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    api.get("/api/dashboard/summary").then((r) => setS(r.data)).catch(() => setErr("Could not load summary"));
  }, []);

  const hasData = (s?.total_transactions ?? 0) > 0;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("overview.title")}</h1>
          <p className="text-muted text-sm mt-1">{t("overview.subtitle")}</p>
        </div>
        {s?.last_updated && (
          <div className="text-xs text-muted">Last updated {fmtDate(s.last_updated)}</div>
        )}
      </div>

      {err && <div className="mt-6 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl p-4 text-sm">{err}</div>}

      {!hasData && !err && s && (
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl p-4 text-sm">
          No dataset loaded. Go to <a href="/data" className="underline">Data Explorer</a> and upload a CSV to populate the platform.
        </div>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <KPI label="Total Transactions" value={fmtNum(s.total_transactions)} />
            <KPI label="Total Value" value={fmtMoney(s.total_value)} />
            <KPI label="Fraud Signals" value={fmtNum(s.fraudulent)}
                 sub={s.fraud_rate != null ? `${fmtPct(s.fraud_rate)} rate` : undefined} />
            <KPI label="Open Alerts" value={fmtNum(s.open_alerts)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
              <div className="text-sm font-semibold mb-4">Risk Band Distribution</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Low", "Medium", "High", "Critical"].map((b) => (
                  <div key={b} className="bg-fg/[0.03] rounded-xl p-4">
                    <div className="text-xs uppercase tracking-wider text-muted">{b}</div>
                    <div className="text-xl font-semibold mt-1">{fmtNum(s.risk_bands[b] ?? 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="text-sm font-semibold mb-4">System Status</div>
              <div className="space-y-3 text-sm">
                <Row icon={<Server size={14} />} label="API" value="Operational" ok />
                <Row icon={<Database size={14} />} label="Database" value="Operational" ok />
                <Row icon={<Cpu size={14} />} label="Model"
                     value={s.model ? `Active · ${s.model.algorithm}` : "Not trained"} ok={!!s.model} />
                <Row icon={<ShieldCheck size={14} />} label="Dataset Mode"
                     value={hasData ? "Loaded" : "Awaiting upload"} ok={hasData} />
              </div>
              {s.model && (
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted">
                  <div>Model: {s.model.name}</div>
                  <div className="font-mono">v{s.model.version}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ icon, label, value, ok }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted">{icon}<span>{label}</span></div>
      <div className={`flex items-center gap-2 ${ok ? "text-emerald-500" : "text-amber-500"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
        {value}
      </div>
    </div>
  );
}
