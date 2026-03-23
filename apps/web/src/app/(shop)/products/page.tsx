"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import type { ProductFilterInput } from "@ecommerce/types";

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilterInput>({
    page: 1,
    limit: 24,
    sortBy: "newest",
  });

  const { data, isLoading, isFetching } = useProducts(filters);
  const products = data?.data ?? [];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar placeholder — add your Navbar component here */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} />
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  value={filters.search ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      search: e.target.value || undefined,
                      page: 1,
                    }))
                  }
                  placeholder="Search products..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {isFetching && !isLoading && (
                  <span className="text-xs text-gray-400">Updating...</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {data?.total ?? 0} products
                </span>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      sortBy: e.target.value as any,
                      page: 1,
                    }))
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-gray-100 animate-pulse aspect-[3/4]"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400">No products found.</p>
                <button
                  onClick={() =>
                    setFilters({ page: 1, limit: 24, sortBy: "newest" })
                  }
                  className="mt-3 text-sm text-black underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: Math.max(1, (f.page ?? 1) - 1),
                    }))
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  {data.page} / {data.pages}
                </span>
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: Math.min(data.pages, (f.page ?? 1) + 1),
                    }))
                  }
                  disabled={filters.page === data.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
