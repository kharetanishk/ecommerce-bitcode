import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";
import type { ApiError } from "@ecommerce/types";

// ─── Axios instance ───────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true, // sends our httpOnly JWT cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor───────────
apiClient.interceptors.request.use(async (config) => {
  // Only runs client-side (getSession is a no-op on server)
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
  }
  return config;
});

// ─── Response interceptor─────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.error ?? error.message ?? "Something went wrong";
    return Promise.reject(
      Object.assign(new Error(message), {
        status: error.response?.status,
        details: error.response?.data?.details,
      }),
    );
  },
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
// Usage: api.get<Product[]>('/api/products')
// Usage: api.post<Order>('/api/orders', { shippingAddress })

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};

// ─── Server-side helper (for use in Server Components / Route Handlers) ───────
// Usage: const products = await serverApi.get<Product[]>('/api/products', token)

export const serverApi = {
  get: <T>(url: string, token?: string) =>
    axios
      .get<T>(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((r) => r.data),
};
