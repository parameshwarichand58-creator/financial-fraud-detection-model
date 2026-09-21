"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, BarChart3, Search, Bell, FolderKanban, Cpu, Sparkles,
  Database, FileText, Boxes, ScrollText, Settings, HelpCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { href: "/", key: "nav.overview", icon: LayoutDashboard },
  { href: "/analytics", key: "nav.analytics", icon: BarChart3 },
  { href: "/transactions", key: "nav.transactions", icon: Search },
  { href: "/alerts", key: "nav.alerts", icon: Bell },
  { href: "/cases", key: "nav.cases", icon: FolderKanban },
  { href: "/models", key: "nav.models", icon: Cpu },
  { href: "/explain", key: "nav.explain", icon: Sparkles },
  { href: "/data", key: "nav.data", icon: Database },
  { href: "/reports", key: "nav.reports", icon: FileText },
  { href: "/registry", key: "nav.registry", icon: Boxes },
  { href: "/audit", key: "nav.audit", icon: ScrollText },
];

const bottom = [
  { href: "/settings", key: "nav.settings", icon: Settings },
  { href: "/help", key: "nav.help", icon: HelpCircle },
];

export function Sidebar() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white">F</div>
        <div className="ml-3">
          <div className="font-semibold text-[13px] leading-tight">Financial Fraud</div><div className="text-[11px] text-muted leading-tight">Detection Model</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ href, key, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-accent/15 text-fg border border-accent/30"
                  : "text-muted hover:bg-fg/[0.04] hover:text-fg"
              )}>
              <Icon size={16} /><span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border space-y-1">
        {bottom.map(({ href, key, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-fg/[0.04] hover:text-fg">
            <Icon size={16} /><span>{t(key)}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
