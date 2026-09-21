"use client";
import { useEffect, useState } from "react";
import { Search, LogOut, Sun, Moon, Monitor, Globe, Command } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useI18n, Lang } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { CommandPalette } from "./CommandPalette";

export function Topbar() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cycleTheme = () => {
    const order = ["dark", "light", "system"] as const;
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % order.length]);
  };

  return (
    <>
      <header className="h-16 border-b border-border flex items-center px-6 gap-3">
        <button onClick={() => setPaletteOpen(true)}
          className="flex-1 max-w-xl flex items-center gap-2 bg-fg/[0.04] border border-border rounded-lg px-3 py-2 text-sm text-muted hover:text-fg hover:border-accent/40 transition-colors text-left">
          <Search size={16} />
          <span>{t("common.search")}…</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-border">
            <Command size={10} />K
          </span>
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-fg/[0.05] text-sm">
            <Globe size={16} />
            <span className="uppercase text-xs font-semibold">{lang}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-lg shadow-lg z-30">
              {(["en","hi","kn"] as Lang[]).map((l) => (
                <button key={l} onClick={() => { setLang(l); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-fg/[0.05] uppercase">
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={cycleTheme} className="p-2 rounded-lg hover:bg-fg/[0.05]" title={`Theme: ${mode}`}>
          {mode === "dark" ? <Moon size={16} /> : mode === "light" ? <Sun size={16} /> : <Monitor size={16} />}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{user?.full_name ?? "Analyst"}</div>
            <div className="text-[11px] text-muted">{user?.email}</div>
          </div>
          <button onClick={() => { logout(); router.push("/login"); }}
            className="p-2 rounded-lg hover:bg-fg/[0.05]" title={t("common.signout")}>
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
