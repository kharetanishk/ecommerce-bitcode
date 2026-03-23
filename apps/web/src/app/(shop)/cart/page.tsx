"use client";

import { useCartStore } from "@/store/cart.store";
import { useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export default function CartPage() {
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <svg
            className="w-20 h-20 text-gray-200 mx-auto"
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Your cart is empty
          </h1>
          <p className="text-gray-400">
            Looks like you haven't added anything yet.
          </p>
          <Link
            href="/products"
            className="inline-block bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const img =
                item.snapshot.images?.find((i: any) => i.isPrimary) ??
                item.snapshot.images?.[0];
              return (
                <div
                  key={item.productId}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex gap-5"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
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

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.snapshot.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.snapshot.category?.name}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(
                          Number(item.snapshot.basePrice) * item.quantity,
                        )}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {formatPrice(item.snapshot.basePrice)} each
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            handleQtyChange(item.productId, item.quantity - 1)
                          }
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQtyChange(item.productId, item.quantity + 1)
                          }
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-sm text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 sticky top-8">
              <h2 className="font-semibold text-gray-900">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-black text-white text-center rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
