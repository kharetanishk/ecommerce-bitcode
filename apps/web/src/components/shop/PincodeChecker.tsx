"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useLocationStore } from "@/store/location.store";

interface DeliveryInfo {
  serviceable: boolean;
  zone: string | null;
  city: string | null;
  state: string | null;
  deliveryDays: string | null;
  shippingCharge: number;
  freeAbove: number | null;
  message: string;
}

interface Props {
  orderTotal?: number;
  onResult?: (info: DeliveryInfo) => void;
  compact?: boolean;
}

export function PincodeChecker({
  orderTotal = 0,
  onResult,
  compact = false,
}: Props) {
  const { pincode: savedPincode, setLocation } = useLocationStore();
  const [pincode, setPincode] = useState(savedPincode ?? "");
  const [result, setResult] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(
    async (pin: string) => {
      if (!/^\d{6}$/.test(pin)) return;
      setLoading(true);

      try {
        const { data } = await api.get<{ data: DeliveryInfo }>(
          `/api/delivery/check?pincode=${pin}&total=${orderTotal}`,
        );
        setResult(data);
        onResult?.(data);

        if (data.serviceable && data.city) {
          setLocation({
            pincode: pin,
            city: data.city,
            state: data.state ?? "",
          });
        }
      } catch {
        setResult({
          serviceable: false,
          zone: null,
          city: null,
          state: null,
          deliveryDays: null,
          shippingCharge: 0,
          freeAbove: null,
          message: "Could not check delivery",
        });
      } finally {
        setLoading(false);
      }
    },
    [orderTotal, onResult, setLocation],
  );

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex gap-2">
        <input
          value={pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setPincode(val);
            if (val.length === 6) check(val);
          }}
          placeholder="Enter pincode"
          maxLength={6}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="button"
          onClick={() => check(pincode)}
          disabled={pincode.length !== 6 || loading}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {loading ? "..." : "Check"}
        </button>
      </div>

      {result && (
        <div
          className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 ${
            result.serviceable
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <span
            className={result.serviceable ? "text-green-600" : "text-red-500"}
          >
            {result.serviceable ? "✓" : "✗"}
          </span>
          <div>
            <p
              className={`font-medium ${result.serviceable ? "text-green-700" : "text-red-600"}`}
            >
              {result.message}
            </p>
            {result.serviceable &&
              result.freeAbove &&
              result.shippingCharge > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  Free delivery on orders above ₹{result.freeAbove}
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
