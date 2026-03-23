"use client";

import { useEffect, useState } from "react";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import type { Category } from "@ecommerce/types";
import { slugify } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  categories: Category[];
}

export function CategoryModal({ open, onClose, editing, categories }: Props) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSlug(editing.slug);
      setParentId(editing.parentId ?? "");
    } else {
      setName("");
      setSlug("");
      setParentId("");
    }
    setError("");
    setSlugTouched(false);
  }, [editing, open]);

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        name,
        slug,
        parentId: parentId || null,
      };

      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createCategory.mutateAsync(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const loading = createCategory.isPending || updateCategory.isPending;

  // Don't render when closed — keeps form state clean
  if (!open) return null;

  // Filter out self from parent options when editing
  const parentOptions = categories.filter((c) => c.id !== editing?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Electronics"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Slug
              <span className="text-gray-400 font-normal ml-1">
                (auto-generated)
              </span>
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              placeholder="e.g. electronics"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Parent category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Parent Category
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">None (root category)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
