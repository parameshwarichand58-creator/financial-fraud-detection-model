"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { bootstrapI18n } from "@/lib/i18n";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe } = useAuth();
  const { apply } = useTheme();
  const router = useRouter();

  useEffect(() => {
    apply();
    bootstrapI18n();
    const token = localStorage.getItem("fraudiq_token");
    if (!token) { router.push("/login"); return; }
    if (!user) fetchMe();
  }, [user, fetchMe, router, apply]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  }

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
