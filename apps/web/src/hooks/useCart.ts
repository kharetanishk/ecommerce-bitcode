import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import type { CartItem } from "@ecommerce/types";
import { toast } from "@/store/toast.store";

const cartKeys = {
  all: () => ["cart"] as const,
};

// Fetch server cart — only when logged in
export function useServerCart() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: cartKeys.all(),
    queryFn: () =>
      api
        .get<{ data: { items: CartItem[]; total: number } }>("/api/cart")
        .then((r) => {
          toast.success("Cart fetched successfully");
          return r.data;
        }),
    enabled: !!token,
    staleTime: 30_000,
  });
}

// Sync server cart into Zustand on login
export function useCartSync() {
  const token = useAuthStore((s) => s.token);
  const { data: serverCart } = useServerCart();
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const localItems = useCartStore((s) => s.items);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || !serverCart) return;

    // Push local items to server that aren't there yet
    const serverProductIds = new Set(
      serverCart.items.map((i: any) => i.productId),
    );
    const toSync = localItems.filter((i) => !serverProductIds.has(i.productId));

    Promise.all(
      toSync.map(
        (item) =>
          api
            .post("/api/cart/items", {
              productId: item.productId,
              quantity: item.quantity,
            })
            .catch(() => null), // ignore individual failures
      ),
    ).then(() => {
      if (toSync.length > 0) {
        qc.invalidateQueries({ queryKey: cartKeys.all() });
        toast.success("Cart synced successfully");
      }
    });

    syncFromServer(
      serverCart.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        snapshot: i.product,
      })),
    );
  }, [token, serverCart]);
}

export function useAddToCart() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      if (token) {
        return api.post("/api/cart/items", { productId, quantity });
      }
      return null; // guest — handled by Zustand only
    },
    onSuccess: (_, { productId: _pid }) => {
      if (token) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Item added to cart successfully");
    },
    onMutate: async ({ productId: _pid }) => {
      openCart();
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      if (token) {
        return quantity === 0
          ? api.delete(`/api/cart/items/${productId}`)
          : api.patch(`/api/cart/items/${productId}`, { quantity });
      }
      return Promise.resolve(null);
    },
    onSuccess: () => {
      if (token) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Item updated in cart successfully");
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const clearStore = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: () => {
      clearStore();
      if (token) return api.delete("/api/cart");
      return Promise.resolve(null);
    },
    onSuccess: () => {
      if (token) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Cart cleared successfully");
    },
  });
}
