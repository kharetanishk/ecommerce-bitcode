"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useAdminProducts } from "@/hooks/useProducts";

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search: "",
    }),
    [],
  );

  const { data, isLoading } = useAdminProducts(defaultFilters);

  const totalProducts = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {user?.name ?? "Admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: isLoading ? "..." : totalProducts,
          },
          { label: "Total Orders", value: "—" },
          { label: "Revenue", value: "—" },
          { label: "Customers", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm text-gray-500">
          Start by creating{" "}
          <a
            href="/admin/categories"
            className="text-black font-medium underline"
          >
            categories and attributes
          </a>{" "}
          before adding products.
        </p>
      </div>
    </div>
  );
}
