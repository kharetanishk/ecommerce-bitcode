"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAdminProducts,
  useToggleVisibility,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@ecommerce/types";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 20,
    search: search || undefined,
  });

  const toggleVisibility = useToggleVisibility();
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct.mutateAsync(p.id);
  }

  async function handleToggle(p: Product) {
    await toggleVisibility.mutateAsync({ id: p.id, isVisible: !p.isVisible });
  }

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
            <Link
              href="/admin/products/new"
              className="mt-3 text-sm text-black font-medium underline"
            >
              Create your first product
            </Link>
          </div>
        ) : (
          <>
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
                    Price
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Stock
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Visibility
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const primaryImg =
                    p.images?.find((img: any) => img.isPrimary) ??
                    p.images?.[0];

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {primaryImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryImg.url}
                              alt={primaryImg.alt}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-300 text-xs">No img</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {p.category?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {formatPrice(p.basePrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium ${
                            p.stock === 0
                              ? "text-red-600"
                              : p.stock < 10
                                ? "text-amber-600"
                                : "text-gray-700"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(p)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            p.isVisible
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {p.isVisible ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="text-gray-500 hover:text-gray-900 text-xs transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(p)}
                            className="text-red-500 hover:text-red-700 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Page {data.page} of {data.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pages, p + 1))
                    }
                    disabled={page === data.pages}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

