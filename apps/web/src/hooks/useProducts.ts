import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Product,
  PaginatedResponse,
  ProductFilterInput,
} from "@ecommerce/types";
import { toast } from "@/store/toast.store";

export const productKeys = {
  all: () => ["products"] as const,
  filtered: (f: ProductFilterInput) => ["products", "list", f] as const,
  adminAll: (f: ProductFilterInput) => ["products", "admin", f] as const,
  detail: (slug: string) => ["products", "detail", slug] as const,
  adminOne: (id: string) => ["products", "admin", "one", id] as const,
};

// ─── Shop hooks ───────────────────────────────────────────────────────────────

export function useProducts(filters: ProductFilterInput) {
  return useQuery({
    queryKey: productKeys.filtered(filters),
    queryFn: () => {
      const params = buildParams(filters);
      return api.get<PaginatedResponse<Product>>(`/api/products?${params}`);
    },
    placeholderData: (prev) => prev, // keep old data while fetching new page
    staleTime: 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () =>
      api.get<{ data: Product }>(`/api/products/${slug}`).then((r) => r.data),

    enabled: !!slug,
    staleTime: 60_000,
  });
}

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminProducts(filters: ProductFilterInput = {}) {
  return useQuery({
    queryKey: ["products", "admin", filters] as const,
    queryFn: () => {
      const params = buildParams(filters);
      return api.get<PaginatedResponse<Product>>(
        `/api/products/admin/all?${params}`,
      );
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: productKeys.adminOne(id),
    queryFn: () =>
      api
        .get<{ data: Product }>(`/api/products/admin/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      api.post<{ data: Product }>("/api/products", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all() });
      toast.success("Product created successfully");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api
        .patch<{ data: Product }>(`/api/products/${id}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all() });
      toast.success("Product updated successfully");
    },
  });
}

export function useToggleVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      api.patch<{ data: Product }>(`/api/products/${id}/visibility`, {
        isVisible,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all() });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all() });
      toast.success("Product deleted successfully");
    },
  });
}

// ─── R2 upload ────────────────────────────────────────────────────────────────

export async function uploadImageToR2(
  file: File,
): Promise<{ url: string; key: string }> {
  // Step 1: get presigned URL from our API
  const { uploadUrl, key, publicUrl } = await api.post<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }>("/api/upload/presign", { contentType: file.type });

  // Step 2: upload directly to R2 — bypasses our server entirely
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return { url: publicUrl, key };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildParams(filters?: ProductFilterInput): string {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters?.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.attrs?.length) params.set("attrs", JSON.stringify(filters.attrs));
  return params.toString();
}
