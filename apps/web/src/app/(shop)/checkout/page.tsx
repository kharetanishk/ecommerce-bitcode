"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useRazorpay } from "@/hooks/useRazorpay";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { PincodeChecker } from "@/components/shop/PincodeChecker";
import type { ShippingAddress } from "@ecommerce/types";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

type CodOrderResponse = { data: { id: string } };

type OnlineOrderResponse = {
  data: {
    order: { id: string };
    razorpayOrderId: string;
    amount: number;
    currency: string;
  };
};

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const { openRazorpay } = useRazorpay();

  // ── State ──────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">(
    "ONLINE",
  );
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.name) {
      setAddress((prev) =>
        prev.name ? prev : { ...prev, name: user.name ?? "" },
      );
    }
  }, [user?.name]);

  function updateAddress(field: keyof ShippingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  // ── Order submission ───────────────────────────────────────────────────────
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setLoading(true);

    try {
      if (paymentMethod === "COD") {
        const res = await api.post<CodOrderResponse>("/api/orders", {
          shippingAddress: address,
          paymentMethod,
        });
        clearCart();
        router.push(`/orders/${res.data.id}?success=true`);
        return;
      }

      const res = await api.post<OnlineOrderResponse>("/api/orders", {
        shippingAddress: address,
        paymentMethod,
      });

      const { order, razorpayOrderId, amount, currency } = res.data;

      setLoading(false);

      openRazorpay({
        orderId: razorpayOrderId,
        amount,
        currency,
        name: "BitCode Store",
        description: `Order #${order.id.slice(0, 8)}`,
        userEmail: user?.email ?? "",
        userName: user?.name ?? "",

        onSuccess: async (response) => {
          setLoading(true);
          try {
            await api.post(`/api/orders/${order.id}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            router.push(`/orders/${order.id}?success=true`);
          } catch {
            setError(
              "Payment verified but order confirmation failed. Contact support.",
            );
            setLoading(false);
          }
        },

        onDismiss: () => {
          setError("Payment was cancelled. Your order is saved — try again.");
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      setLoading(false);
    }
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500">Your cart is empty.</p>
          <a href="/products" className="text-black underline text-sm">
            Browse products
          </a>
        </div>
      </div>
    );
  }

  const grandTotal = getTotal() + shippingCharge;

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left column — Address + Delivery + Payment ──────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address form */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">
                  Shipping Address
                </h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Full name */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      value={address.name}
                      onChange={(e) => updateAddress("name", e.target.value)}
                      required
                      placeholder="As on ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      value={address.phone}
                      onChange={(e) => updateAddress("phone", e.target.value)}
                      required
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Address line 1 */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Address Line 1
                    </label>
                    <input
                      value={address.line1}
                      onChange={(e) => updateAddress("line1", e.target.value)}
                      required
                      placeholder="House/Flat no., Street, Area"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Address line 2 */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Address Line 2{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={address.line2}
                      onChange={(e) => updateAddress("line2", e.target.value)}
                      placeholder="Landmark, Colony"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      value={address.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      required
                      placeholder="Mumbai"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      value={address.pincode}
                      onChange={(e) => updateAddress("pincode", e.target.value)}
                      required
                      maxLength={6}
                      placeholder="400001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* State */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      State
                    </label>
                    <select
                      value={address.state}
                      onChange={(e) => updateAddress("state", e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pincode checker — checks serviceability + calculates charge */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Check Delivery
                    </label>
                    <PincodeChecker
                      orderTotal={getTotal()}
                      onResult={(info) => {
                        setDeliveryInfo(info);
                        setShippingCharge(info.shippingCharge);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment method toggle */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Payment Method</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(["ONLINE", "COD"] as const).map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${
                        paymentMethod === method
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="accent-black"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {method === "ONLINE"
                            ? "Pay Online"
                            : "Cash on Delivery"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {method === "ONLINE"
                            ? "UPI, Cards, Net Banking via Razorpay"
                            : "Pay when your order arrives"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right column — Order summary ─────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 sticky top-8">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>

                {/* Items list */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const img =
                      item.snapshot.images?.find((i: any) => i.isPrimary) ??
                      item.snapshot.images?.[0];
                    return (
                      <div key={item.productId} className="flex gap-3 text-sm">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img.url}
                              alt={img.alt}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">
                            {item.snapshot.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 shrink-0">
                          {formatPrice(
                            Number(item.snapshot.basePrice) * item.quantity,
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>

                  {/* Shipping charge — dynamic based on pincode zone */}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span
                      className={shippingCharge === 0 ? "text-green-600" : ""}
                    >
                      {shippingCharge === 0 ? "Free" : `₹${shippingCharge}`}
                    </span>
                  </div>

                  {/* Delivery estimate from pincode check */}
                  {deliveryInfo?.deliveryDays && (
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span>Estimated delivery</span>
                      <span>{deliveryInfo.deliveryDays}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    loading || (deliveryInfo && !deliveryInfo.serviceable)
                  }
                  className="w-full bg-black text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Processing..."
                    : paymentMethod === "COD"
                      ? `Place Order · ${formatPrice(grandTotal)}`
                      : `Pay ${formatPrice(grandTotal)}`}
                </button>

                {/* Not serviceable warning */}
                {deliveryInfo && !deliveryInfo.serviceable && (
                  <p className="text-xs text-red-600 text-center">
                    We don't deliver to this pincode yet.
                  </p>
                )}

                {/* Security badge — only for online payment */}
                {paymentMethod === "ONLINE" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Secured by Razorpay
                  </div>
                )}

                {/* COD note */}
                {paymentMethod === "COD" && (
                  <p className="text-xs text-gray-400 text-center">
                    Pay in cash when your order is delivered
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
