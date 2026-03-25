"use client";

import { useAuthStore } from "@/store/auth.store";
import { loginApi, logoutApi, registerApi } from "@/lib/authApi";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/store/toast.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  const router = useRouter();
  const queryClient = useQueryClient();

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { user: u, token: t } = await loginApi(email, password);
      setAuth(u, t);
      toast.success(`Welcome back, ${u.name ?? u.email}!`);
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function register(name: string, email: string, password: string) {
    setLoading(true);
    try {
      const { user: u, token: t } = await registerApi(name, email, password);
      setAuth(u, t);
      toast.success("Account created!");
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {
      /* ignore */
    }
    clearAuth();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return {
    user,
    token,
    isLoggedIn: !!user,
    isAdmin: user?.role === "ADMIN",
    isLoading,
    login,
    register,
    logout,
  };
}
