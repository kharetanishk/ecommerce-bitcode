"use client";

import { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { AttributeDrawer } from "@/components/admin/AttributeDrawer";
import type { Category } from "@ecommerce/types";
import { slugify } from "@/lib/utils";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setModalOpen(true);
  }

  function openAttributes(cat: Category) {
    setSelectedCat(cat);
    setDrawerOpen(true);
  }

  async function handleDelete(cat: Category) {
    setDeleteError(null);
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory.mutateAsync(cat.id);
    } catch (err: any) {
      setDeleteError(err.message);
    }
  }

  // Build parent name map for display
  const parentMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {deleteError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No categories yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-black font-medium underline"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Slug
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Parent
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Attributes
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {cat.parentId ? (
                      (parentMap.get(cat.parentId) ?? "—")
                    ) : (
                      <span className="text-gray-300">Root</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openAttributes(cat)}
                      className="text-black text-xs font-medium underline hover:no-underline"
                    >
                      Manage attributes
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-gray-500 hover:text-gray-900 text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="text-red-500 hover:text-red-700 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        categories={categories}
      />

      {selectedCat && (
        <AttributeDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          category={selectedCat}
        />
      )}
    </div>
  );
}
