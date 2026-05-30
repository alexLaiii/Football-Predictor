"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  loginUser,
  registerUser,
  getMe,
  type AuthUser,
} from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "kim-ai-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    setToken(saved);
    getMe(saved).then((u) => {
      if (u) setUser(u);
      else localStorage.removeItem(TOKEN_KEY);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const r = await loginUser(username, password);
    localStorage.setItem(TOKEN_KEY, r.token);
    setToken(r.token);
    setUser(r.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const r = await registerUser(username, password);
    localStorage.setItem(TOKEN_KEY, r.token);
    setToken(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
