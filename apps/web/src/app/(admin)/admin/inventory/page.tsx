"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/store/toast.store";

interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  isVisible: boolean;
  images: any[];
  category: { name: string } | null;
  _count: { orderItems: number };
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () =>
      api
        .get<{ data: InventoryProduct[] }>("/api/inventory")
        .then((r) => r.data),
  });

  const updateStock = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      api.patch(`/api/inventory/${id}`, { stock }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Stock updated");
    },
  });

  function handleEdit(id: string, val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0) setEdits((prev) => ({ ...prev, [id]: n }));
  }

  function handleSave(id: string, originalStock: number) {
    const newStock = edits[id];
    if (newStock === undefined || newStock === originalStock) return;
    updateStock.mutate({ id, stock: newStock });
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalProducts = products.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalProducts} products · {lowStock} low stock · {outOfStock} out of
          stock
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalProducts}
          </p>
        </div>
        <div
          className={`border rounded-xl p-4 ${lowStock > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}
        >
          <p
            className={`text-xs ${lowStock > 0 ? "text-amber-600" : "text-gray-500"}`}
          >
            Low Stock
          </p>
          <p
            className={`text-2xl font-semibold mt-1 ${lowStock > 0 ? "text-amber-700" : "text-gray-900"}`}
          >
            {lowStock}
          </p>
        </div>
        <div
          className={`border rounded-xl p-4 ${outOfStock > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
        >
          <p
            className={`text-xs ${outOfStock > 0 ? "text-red-600" : "text-gray-500"}`}
          >
            Out of Stock
          </p>
          <p
            className={`text-2xl font-semibold mt-1 ${outOfStock > 0 ? "text-red-700" : "text-gray-900"}`}
          >
            {outOfStock}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by product or category..."
        className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No products found.
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
                  Total Sold
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Stock
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const img = product.images?.[0];
                const editVal = edits[product.id];
                const isDirty =
                  editVal !== undefined && editVal !== product.stock;
                const stockLevel =
                  product.stock === 0
                    ? "out"
                    : product.stock < 10
                      ? "low"
                      : "ok";

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
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
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product._count.orderItems} units
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          stockLevel === "out"
                            ? "bg-red-50 text-red-700"
                            : stockLevel === "low"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {stockLevel === "out"
                          ? "Out of stock"
                          : stockLevel === "low"
                            ? "Low stock"
                            : "In stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={editVal ?? product.stock}
                        onChange={(e) => handleEdit(product.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSave(product.id, product.stock);
                        }}
                        className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black transition-colors ${
                          isDirty
                            ? "border-black bg-black/5"
                            : "border-gray-200"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {isDirty && (
                        <button
                          onClick={() => handleSave(product.id, product.stock)}
                          disabled={updateStock.isPending}
                          className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
