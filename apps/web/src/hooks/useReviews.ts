import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/store/toast.store";
import type { Review } from "@ecommerce/types";

interface ReviewsMeta {
  total: number;
  avgRating: number | null;
  distribution: Record<number, number>;
}

const reviewKeys = {
  all: (productId: string) => ["reviews", productId] as const,
};

export function useReviews(productId: string) {
  return useQuery({
    queryKey: reviewKeys.all(productId),
    queryFn: () =>
      api
        .get<{
          data: Review[];
          meta: ReviewsMeta;
        }>(`/api/products/${productId}/reviews`)
        .then((r) => {
          toast.success("Reviews fetched successfully");
          return r; // keep { data, meta } for consumers
        }),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; title?: string; body?: string }) =>
      api
        .post<{ data: Review }>(`/api/products/${productId}/reviews`, data)
        .then((r) => {
          toast.success("Review submitted successfully");
          return r.data;
        }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all(productId) });
      toast.success("Review submitted successfully");
    },
  });
}

export function useDeleteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) =>
      api.delete(`/api/products/${productId}/reviews/${reviewId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all(productId) });
      toast.success("Review deleted");
    },
  });
}
