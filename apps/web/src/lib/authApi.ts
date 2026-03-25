import { api } from "@/lib/api";
import type { User } from "@ecommerce/types";

export async function loginApi(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  return api.post("/api/auth/login", { email, password });
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  return api.post("/api/auth/register", { name, email, password });
}

export async function getMeApi(): Promise<{ user: User }> {
  return api.get("/api/auth/me");
}

export async function logoutApi(): Promise<void> {
  await api.post("/api/auth/logout");
}
