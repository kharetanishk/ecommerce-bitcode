"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/store/toast.store";
import type { Order, OrderStatus } from "@ecommerce/types";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () =>
      api.get<{ data: Order[] }>("/api/orders").then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated");
    },
  });

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s === "ALL" ? `All (${orders.length})` : s}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No orders found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Items
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Date
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === order.id ? null : order.id)
                    }
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono font-medium text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{(order.user as any)?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">
                        {(order.user as any)?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === order.id && (
                    <tr key={`${order.id}-expanded`}>
                      <td
                        colSpan={7}
                        className="px-6 py-4 bg-gray-50 border-b border-gray-100"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          {/* Items list */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Items
                            </p>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-700">
                                    {item.product?.name ?? "Product"}
                                    <span className="text-gray-400 ml-1">
                                      ×{item.quantity}
                                    </span>
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {formatPrice(
                                      Number(item.priceSnapshot) *
                                        item.quantity,
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status updater + shipping address */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Update Status
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {ALL_STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatus.mutate({
                                        id: order.id,
                                        status: s,
                                      });
                                    }}
                                    disabled={
                                      order.status === s ||
                                      updateStatus.isPending
                                    }
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-40 ${
                                      order.status === s
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Shipping Address
                              </p>
                              {(() => {
                                const a = order.shippingAddress as any;
                                return (
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    <p className="font-medium">
                                      {a.name} · {a.phone}
                                    </p>
                                    <p>
                                      {a.line1}
                                      {a.line2 ? `, ${a.line2}` : ""}
                                    </p>
                                    <p>
                                      {a.city}, {a.state} — {a.pincode}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
