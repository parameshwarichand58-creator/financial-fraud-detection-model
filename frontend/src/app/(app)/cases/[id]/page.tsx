"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CaseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    const [cr, tr] = await Promise.all([
      api.get(`/api/cases/${id}`),
      api.get(`/api/cases/${id}/timeline`),
    ]);
    setC(cr.data); setEvents(tr.data); setStatus(cr.data.status);
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async () => { await api.patch(`/api/cases/${id}`, { status }); load(); };
  const addNote = async () => {
    if (!note.trim()) return;
    await api.post(`/api/cases/${id}/notes`, { message: note });
    setNote(""); load();
  };

  if (!c) return <div className="text-muted">Loading…</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-fg">← Back</button>
      <h1 className="text-2xl font-bold mt-2">CS-{c.id} · {c.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface border border-border rounded-2xl p-5 md:col-span-2">
          <div className="text-sm font-semibold mb-3">Case Summary</div>
          <p className="text-sm text-muted">{c.description ?? "No description."}</p>

          <div className="text-sm font-semibold mt-6 mb-2">Timeline</div>
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="border-l border-border pl-4">
                <div className="text-sm">{e.message}</div>
                <div className="text-xs text-muted">{e.event_type} · {new Date(e.created_at).toLocaleString()}</div>
              </div>
            ))}
            {events.length === 0 && <div className="text-sm text-muted">No events yet.</div>}
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Add Note</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="w-full bg-fg/[0.04] border border-border rounded-lg p-3 text-sm outline-none focus:border-accent/50"
              placeholder="Analyst note…" />
            <button onClick={addNote} className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-sm">
              Add note
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm">
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <button onClick={updateStatus}
            className="mt-3 w-full py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm text-white">
            Update Status
          </button>

          <div className="mt-6 space-y-2 text-xs text-muted">
            <div>Priority: {c.priority}</div>
            <div>Created: {new Date(c.created_at).toLocaleString()}</div>
            {c.transaction_id && (
              <a href={`/transactions/${c.transaction_id}`} className="text-indigo-500 hover:underline block">
                Related transaction →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
