"use client";

import { useCartStore } from "@/store/cart.store";
import { useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const updateItem = useUpdateCartItem();

  function handleQtyChange(productId: string, qty: number) {
    updateQty(productId, qty);
    updateItem.mutate({ productId, quantity: qty });
  }

  function handleRemove(productId: string) {
    removeItem(productId);
    updateItem.mutate({ productId, quantity: 0 });
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-md z-50 bg-white shadow-2xl
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <svg
                className="w-16 h-16 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <div>
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-1">
                  Add some products to get started
                </p>
              </div>
              <button
                onClick={closeCart}
                className="text-sm text-black font-medium underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => {
              const img =
                item.snapshot.images?.find((i: any) => i.isPrimary) ??
                item.snapshot.images?.[0];
              return (
                <div key={item.productId} className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.snapshot.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.snapshot.basePrice)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            handleQtyChange(item.productId, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQtyChange(item.productId, item.quantity + 1)
                          }
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item total */}
                  <p className="text-sm font-medium text-gray-900 shrink-0">
                    {formatPrice(
                      Number(item.snapshot.basePrice) * item.quantity,
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-lg font-semibold">
                {formatPrice(getTotal())}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Shipping calculated at checkout
            </p>
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full bg-black text-white text-center rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="block w-full border border-gray-300 text-gray-700 text-center rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
