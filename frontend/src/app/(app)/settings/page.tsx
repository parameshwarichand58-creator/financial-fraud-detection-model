"use client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useI18n, Lang } from "@/lib/i18n";

export default function SettingsPage() {
  const { user } = useAuth();
  const { mode, setMode } = useTheme();
  const { lang, setLang } = useI18n();

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted text-sm mt-1">Manage your profile and platform preferences.</p>

      <Section title="Profile">
        <Field label="Full name" value={user?.full_name ?? ""} />
        <Field label="Email" value={user?.email ?? ""} />
        <Field label="Role" value={user?.role ?? "ANALYST"} />
      </Section>

      <Section title="Appearance">
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm capitalize border ${
                mode === m ? "bg-accent/20 border-accent/40 text-fg" : "border-border text-muted hover:text-fg"
              }`}>
              {m}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Language">
        <div className="flex gap-2">
          {([["en","English"],["hi","हिंदी"],["kn","ಕನ್ನಡ"]] as [Lang,string][]).map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                lang === code ? "bg-accent/20 border-accent/40 text-fg" : "border-border text-muted hover:text-fg"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Risk Thresholds">
        <Field label="Review threshold (≥ probability creates an alert)" value="0.60" />
        <Field label="Critical threshold" value="0.85" />
        <p className="text-xs text-amber-500 mt-4">
          Changing thresholds affects review volume and model operating behaviour.
        </p>
      </Section>

      <Section title="Model Limitations">
        <ul className="text-sm text-muted space-y-1 list-disc pl-5">
          <li>Model probability is not proof of fraud.</li>
          <li>False positives and false negatives are possible.</li>
          <li>Historical patterns may not reflect future behaviour.</li>
          <li>This prototype does not represent production banking infrastructure.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="mt-6 bg-surface border border-border rounded-2xl p-6 max-w-2xl">
      <div className="text-sm font-semibold mb-4">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="bg-fg/[0.03] border border-border rounded-lg px-3 py-2 text-sm">{value}</div>
    </div>
  );
}
