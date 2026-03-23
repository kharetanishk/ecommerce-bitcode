"use client";

import { useCategoryTree } from "@/hooks/useCategories";
import type { ProductFilterInput, AttributeFilter } from "@ecommerce/types";

interface Props {
  filters: ProductFilterInput;
  onChange: (f: ProductFilterInput) => void;
}

export function FilterSidebar({ filters, onChange }: Props) {
  const { data: tree = [] } = useCategoryTree();

  function setAttrFilter(defId: string, value: string, checked: boolean) {
    const existing = filters.attrs ?? [];
    const current = existing.find((a) => a.defId === defId);

    let next: AttributeFilter[];

    if (checked) {
      if (current) {
        next = existing.map((a) =>
          a.defId === defId ? { ...a, values: [...a.values, value] } : a,
        );
      } else {
        next = [...existing, { defId, values: [value] }];
      }
    } else {
      next = existing
        .map((a) =>
          a.defId === defId
            ? { ...a, values: a.values.filter((v) => v !== value) }
            : a,
        )
        .filter((a) => a.values.length > 0);
    }

    onChange({ ...filters, attrs: next, page: 1 });
  }

  function isChecked(defId: string, value: string) {
    return (
      filters.attrs?.find((a) => a.defId === defId)?.values.includes(value) ??
      false
    );
  }

  // Find selected category's attribute definitions
  const selectedCategory =
    tree.find((c) => c.id === filters.categoryId) ??
    tree
      .flatMap((c) => c.children ?? [])
      .find((c) => c.id === filters.categoryId);

  const filterableAttrs =
    selectedCategory?.attributeDefinitions?.filter((a) => a.filterable) ?? [];

  return (
    <aside className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() =>
              onChange({
                ...filters,
                categoryId: undefined,
                attrs: [],
                page: 1,
              })
            }
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
              !filters.categoryId
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Categories
          </button>
          {tree.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    categoryId: cat.id,
                    attrs: [],
                    page: 1,
                  })
                }
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                  filters.categoryId === cat.id
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
              {/* Subcategories */}
              {cat.children?.map((child) => (
                <button
                  key={child.id}
                  onClick={() =>
                    onChange({
                      ...filters,
                      categoryId: child.id,
                      attrs: [],
                      page: 1,
                    })
                  }
                  className={`w-full text-left text-sm px-2 py-1.5 pl-6 rounded-lg transition-colors ${
                    filters.categoryId === child.id
                      ? "bg-black text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Price (₹)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Dynamic attribute filters — only filterable ones */}
      {filterableAttrs.map((attr) => (
        <div key={attr.id}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {attr.name}
          </h3>

          {(attr.type === "SELECT" || attr.type === "MULTI_SELECT") &&
            attr.options && (
              <div className="space-y-2">
                {(attr.options as string[]).map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked(attr.id, opt)}
                      onChange={(e) =>
                        setAttrFilter(attr.id, opt, e.target.checked)
                      }
                      className="accent-black w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-600">{opt}</span>
                  </label>
                ))}
              </div>
            )}

          {attr.type === "BOOLEAN" && (
            <div className="space-y-2">
              {["true", "false"].map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked(attr.id, val)}
                    onChange={(e) =>
                      setAttrFilter(attr.id, val, e.target.checked)
                    }
                    className="accent-black w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">
                    {val === "true" ? "Yes" : "No"}
                  </span>
                </label>
              ))}
            </div>
          )}

          {attr.type === "NUMBER" && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                onChange={(e) => {
                  if (e.target.value)
                    setAttrFilter(attr.id, `>=${e.target.value}`, true);
                }}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                placeholder="Max"
                onChange={(e) => {
                  if (e.target.value)
                    setAttrFilter(attr.id, `<=${e.target.value}`, true);
                }}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}
        </div>
      ))}

      {/* Clear all */}
      {(filters.categoryId ||
        filters.minPrice ||
        filters.maxPrice ||
        (filters.attrs?.length ?? 0) > 0) && (
        <button
          onClick={() => onChange({ page: 1, limit: 24, sortBy: "newest" })}
          className="w-full text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}
