import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@ecommerce/types";

export interface CartItem {
  productId: string;
  quantity: number;
  snapshot: Product; // price/name locked at add-time for display
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean; // drawer open state

  // Actions
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  syncFromServer: (serverItems: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, qty = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + qty, product.stock),
                    }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { productId: product.id, quantity: qty, snapshot: product },
            ],
          };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce(
          (sum, i) => sum + Number(i.snapshot.basePrice) * i.quantity,
          0,
        ),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      // Called after login — merges local cart with server cart
      // Local items win (higher quantity kept)
      syncFromServer: (serverItems) => {
        set((state) => {
          const merged = [...state.items];
          for (const serverItem of serverItems) {
            const local = merged.find(
              (i) => i.productId === serverItem.productId,
            );
            if (!local) {
              merged.push(serverItem);
            } else if (serverItem.quantity > local.quantity) {
              const idx = merged.indexOf(local);
              merged[idx] = { ...local, quantity: serverItem.quantity };
            }
          }
          return { items: merged };
        });
      },
    }),
    {
      name: "ecommerce-cart",
      // Only persist items, not UI state like isOpen
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
