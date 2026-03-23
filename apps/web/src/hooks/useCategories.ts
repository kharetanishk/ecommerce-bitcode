import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, AttributeDefinition } from "@ecommerce/types";
import { toast } from "@/store/toast.store";

// ─── Query keys — centralised so invalidation is consistent ──────────────────
export const categoryKeys = {
  all: () => ["categories"] as const,
  tree: () => ["categories", "tree"] as const,
  one: (id: string) => ["categories", id] as const,
  attrs: (id: string) => ["categories", id, "attributes"] as const,
};

// ─── Fetch all categories (flat list for dropdowns) ──────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all(),
    queryFn: () =>
      api.get<{ data: Category[] }>("/api/categories").then((r) => {
        toast.success("Categories fetched successfully");
        return r.data;
      }),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Fetch nested tree (for filter sidebar + product form) ───────────────────
export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: () =>
      api.get<{ data: Category[] }>("/api/categories/tree").then((r) => {
        toast.success("Category tree fetched successfully");
        return r.data;
      }),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Fetch single category with its attributes ───────────────────────────────
export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.one(id),
    queryFn: () =>
      api.get<{ data: Category }>(`/api/categories/${id}`).then((r) => {
        toast.success("Category fetched successfully");
        return r.data;
      }),
    enabled: !!id,
  });
}

// ─── Create category ─────────────────────────────────────────────────────────
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      parentId?: string | null;
    }) =>
      api.post<{ data: Category }>("/api/categories", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Category created successfully");
    },
  });
}

// ─── Update category ─────────────────────────────────────────────────────────
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ name: string; slug: string; parentId: string | null }>;
    }) =>
      api
        .patch<{ data: Category }>(`/api/categories/${id}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Category updated successfully");
    },
  });
}

// ─── Delete category ─────────────────────────────────────────────────────────
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(`/api/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Category deleted successfully");
    },
  });
}

// ─── Attribute definitions ────────────────────────────────────────────────────
export function useAttributeDefs(categoryId: string) {
  return useQuery({
    queryKey: categoryKeys.attrs(categoryId),
    queryFn: () =>
      api
        .get<{
          data: AttributeDefinition[];
        }>(`/api/categories/${categoryId}/attributes`)
        .then((r) => {
          toast.success("Attribute definitions fetched successfully");
          return r.data;
        }),
    enabled: !!categoryId,
  });
}

export function useCreateAttributeDef(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      type: string;
      options?: string[] | null;
      filterable: boolean;
      required: boolean;
      sortOrder: number;
    }) =>
      api
        .post<{
          data: AttributeDefinition;
        }>(`/api/categories/${categoryId}/attributes`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.attrs(categoryId) });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Attribute definition created successfully");
    },
  });
}

export function useUpdateAttributeDef(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        type: string;
        options: string[] | null;
        filterable: boolean;
        required: boolean;
        sortOrder: number;
      }>;
    }) =>
      api
        .patch<{
          data: AttributeDefinition;
        }>(`/api/categories/${categoryId}/attributes/${id}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.attrs(categoryId) });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Attribute definition updated successfully");
    },
  });
}

export function useDeleteAttributeDef(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/categories/${categoryId}/attributes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.attrs(categoryId) });
      qc.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Attribute definition deleted successfully");
    },
  });
}
