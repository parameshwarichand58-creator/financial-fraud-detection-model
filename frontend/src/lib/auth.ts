"use client";
import { create } from "zustand";
import { api } from "./api";

type User = { id: number; email: string; full_name: string; role: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  login: async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("fraudiq_token", data.access_token);
    const me = await api.get("/api/auth/me");
    set({ user: me.data });
  },
  register: async (email, fullName, password) => {
    await api.post("/api/auth/register", { email, full_name: fullName, password });
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("fraudiq_token", data.access_token);
    const me = await api.get("/api/auth/me");
    set({ user: me.data });
  },
  logout: () => {
    localStorage.removeItem("fraudiq_token");
    set({ user: null });
  },
  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/api/auth/me");
      set({ user: data });
    } catch { set({ user: null }); }
    finally { set({ loading: false }); }
  },
}));
