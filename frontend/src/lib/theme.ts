"use client";
import { create } from "zustand";

type Mode = "light" | "dark" | "system";

type ThemeState = {
  mode: Mode;
  setMode: (m: Mode) => void;
  apply: () => void;
};

function resolve(mode: Mode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: "dark",
  setMode: (m) => {
    if (typeof window !== "undefined") localStorage.setItem("fraudiq_theme", m);
    set({ mode: m });
    get().apply();
  },
  apply: () => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("fraudiq_theme") as Mode) || "dark";
    set({ mode: stored });
    const resolved = resolve(stored);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  },
}));
