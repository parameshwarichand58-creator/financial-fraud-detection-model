"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@fraudiq.io");
  const [password, setPassword] = useState("demo12345");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      if (tab === "login") await login(email, password);
      else await register(email, fullName, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">F</div>
          <h1 className="text-2xl font-bold mt-4">Financial Fraud Detection Model</h1>
          <p className="text-muted text-sm mt-1">Risk Intelligence Platform</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex gap-2 mb-5">
            {(["login", "register"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === k ? "bg-accent/20 text-fg" : "text-muted hover:text-fg"
                }`}>
                {k === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === "register" && (
              <input required placeholder="Full name" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50" />
            )}
            <input required type="email" placeholder="you@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50" />
            <input required type="password" placeholder="Password (min 8 chars)" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50" />
            {error && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={busy}
              className="w-full py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 font-medium text-sm text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-xs text-muted text-center">
            Demo: <span className="font-mono">demo@fraudiq.io / demo12345</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted mt-6">
          Model predictions are review signals — not confirmed fraud.
        </p>
      </div>
    </div>
  );
}
