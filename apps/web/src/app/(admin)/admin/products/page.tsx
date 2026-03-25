"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@ecommerce/types";
import { useAdminProducts } from "@/hooks/useProducts";

export default function ProductsAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 20,
    search: search || undefined,
  });

  const products = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ?? 0} product{data?.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search products..."
        className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No products found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Visibility
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p: Product) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {"category" in p && p.category?.name ? p.category.name : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {typeof p.isVisible === "boolean"
                      ? p.isVisible
                        ? "Visible"
                        : "Hidden"
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-black text-xs font-medium underline hover:no-underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

