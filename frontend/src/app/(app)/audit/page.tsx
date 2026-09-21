"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    api.get("/api/audit", { params: { page: 1, page_size: 100 } })
      .then((r) => setLogs(r.data.items));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <p className="text-muted text-sm mt-1">Every important action recorded for compliance.</p>

      <div className="mt-6 bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-fg/[0.03] text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Entity</th>
              <th className="text-left px-4 py-3">Entity ID</th>
              <th className="text-left px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted text-xs">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3">{l.entity}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.entity_id ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{l.detail ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-muted">No audit events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
