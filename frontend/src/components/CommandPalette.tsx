"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const commands = [
  { label: "Overview", href: "/" },
  { label: "Fraud Analytics", href: "/analytics" },
  { label: "Transaction Investigation", href: "/transactions" },
  { label: "Alert Center", href: "/alerts" },
  { label: "Case Management", href: "/cases" },
  { label: "Model Performance", href: "/models" },
  { label: "Explain AI", href: "/explain" },
  { label: "Data Explorer", href: "/data" },
  { label: "Reports", href: "/reports" },
  { label: "Model Registry", href: "/registry" },
  { label: "Audit Log", href: "/audit" },
  { label: "Settings", href: "/settings" },
  { label: "Help", href: "/help" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, transactions, cases…"
            className="flex-1 bg-transparent outline-none text-sm" />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c.href} onClick={() => { router.push(c.href); onClose(); }}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-fg/[0.05]">
              {c.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}
