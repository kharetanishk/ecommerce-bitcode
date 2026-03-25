import axios, { AxiosError } from "axios";
import type { ApiError } from "@ecommerce/types";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:0311",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Normalise errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.error ?? error.message ?? "Something went wrong";

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ecommerce-auth");
      }
    }

    return Promise.reject(
      Object.assign(new Error(message), {
        status: error.response?.status,
        details: error.response?.data?.details,
      }),
    );
  },
);

export const api = {
  get: <T>(url: string) => apiClient.get<T>(url).then((r) => r.data),
  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),
  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),
  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),
  delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
};
