import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import type { CartItem } from "@ecommerce/types";
import { toast } from "@/store/toast.store";

const cartKeys = {
  all: () => ["cart"] as const,
};

// Fetch server cart — only when logged in
export function useServerCart() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: cartKeys.all(),
    queryFn: () =>
      api
        .get<{ data: { items: CartItem[]; total: number } }>("/api/cart")
        .then((r) => {
          toast.success("Cart fetched successfully");
          return r.data;
        }),
    enabled: !!session,
    staleTime: 30_000,
  });
}

// Sync server cart into Zustand on login
export function useCartSync() {
  const { data: session } = useSession();
  const { data: serverCart } = useServerCart();
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const localItems = useCartStore((s) => s.items);
  const qc = useQueryClient();

  useEffect(() => {
    if (!session || !serverCart) return;

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
  }, [session, serverCart]);
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { data: session } = useSession();
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
      if (session) {
        return api.post("/api/cart/items", { productId, quantity });
      }
      return null; // guest — handled by Zustand only
    },
    onSuccess: (_, { productId: _pid }) => {
      if (session) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Item added to cart successfully");
    },
    onMutate: async ({ productId: _pid }) => {
      openCart();
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      if (session) {
        return quantity === 0
          ? api.delete(`/api/cart/items/${productId}`)
          : api.patch(`/api/cart/items/${productId}`, { quantity });
      }
      return Promise.resolve(null);
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Item updated in cart successfully");
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const clearStore = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: () => {
      clearStore();
      if (session) return api.delete("/api/cart");
      return Promise.resolve(null);
    },
    onSuccess: () => {
      if (session) qc.invalidateQueries({ queryKey: cartKeys.all() });
      toast.success("Cart cleared successfully");
    },
  });
}
