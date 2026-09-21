"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function RegistryPage() {
  const [models, setModels] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => { api.get("/api/models").then((r) => setModels(r.data)); };
  useEffect(() => { load(); }, []);

  const activate = async (id: number) => {
    if (!confirm("Activate this model version? Future predictions will use it.")) return;
    await api.post(`/api/models/${id}/activate`);
    setMsg(`Model ${id} activated.`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Model Registry</h1>
      <p className="text-muted text-sm mt-1">All trained model versions and their status.</p>

      {msg && <div className="mt-4 text-sm text-emerald-500">{msg}</div>}

      <div className="mt-6 bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-fg/[0.03] text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Algorithm</th>
              <th className="text-left px-4 py-3">Version</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{m.id}</td>
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3">{m.algorithm}</td>
                <td className="px-4 py-3 font-mono text-xs">{m.version}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.is_active ? "bg-emerald-500/20 text-emerald-500" : "bg-fg/[0.06] text-muted"
                  }`}>
                    {m.is_active ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{new Date(m.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {!m.is_active && (
                    <button onClick={() => activate(m.id)}
                      className="text-xs px-2 py-1 rounded border border-border hover:border-accent/50">
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted">No models trained yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
