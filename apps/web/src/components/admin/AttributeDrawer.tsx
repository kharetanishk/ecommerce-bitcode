"use client";

import { useState } from "react";
import {
  useAttributeDefs,
  useCreateAttributeDef,
  useUpdateAttributeDef,
  useDeleteAttributeDef,
} from "@/hooks/useCategories";
import { AttributeForm } from "./AttributeForm";
import type { Category, AttributeDefinition } from "@ecommerce/types";

interface Props {
  open: boolean;
  onClose: () => void;
  category: Category;
}

const TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SELECT: "Single select",
  MULTI_SELECT: "Multi select",
  BOOLEAN: "Yes / No",
};

const TYPE_COLORS: Record<string, string> = {
  TEXT: "bg-gray-100 text-gray-600",
  NUMBER: "bg-blue-50 text-blue-700",
  SELECT: "bg-purple-50 text-purple-700",
  MULTI_SELECT: "bg-indigo-50 text-indigo-700",
  BOOLEAN: "bg-green-50 text-green-700",
};

export function AttributeDrawer({ open, onClose, category }: Props) {
  const { data: attrs = [], isLoading } = useAttributeDefs(category.id);
  const deleteAttr = useDeleteAttributeDef(category.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: AttributeDefinition) {
    setEditing(a);
    setFormOpen(true);
  }

  async function handleDelete(a: AttributeDefinition) {
    setDeleteError(null);
    if (!confirm(`Delete attribute "${a.name}"?`)) return;
    try {
      await deleteAttr.mutateAsync(a.id);
    } catch (err: any) {
      setDeleteError(err.message);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-lg z-50 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {category.name} — Attributes
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {attrs.length} attribute{attrs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {deleteError}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : attrs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No attributes yet.</p>
              <p className="text-gray-400 text-xs mt-1">
                Attributes define the fields shown when creating a product in
                this category.
              </p>
            </div>
          ) : (
            attrs.map((attr) => (
              <div
                key={attr.id}
                className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-gray-300 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">
                      {attr.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[attr.type]}`}
                    >
                      {TYPE_LABELS[attr.type]}
                    </span>
                    {attr.filterable && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                        Filterable
                      </span>
                    )}
                    {attr.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Show options for SELECT types */}
                  {attr.options &&
                    Array.isArray(attr.options) &&
                    attr.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(attr.options as string[]).map((opt) => (
                          <span
                            key={opt}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(attr)}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(attr)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={openCreate}
            className="w-full bg-black text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Attribute
          </button>
        </div>
      </div>

      {/* Attribute form modal — sits on top of drawer */}
      {formOpen && (
        <AttributeForm
          categoryId={category.id}
          editing={editing}
          onClose={() => setFormOpen(false)}
        />
      )}
    </>
  );
}
