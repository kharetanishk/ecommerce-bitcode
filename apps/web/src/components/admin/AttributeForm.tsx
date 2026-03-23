"use client";

import { useEffect, useState } from "react";
import {
  useCreateAttributeDef,
  useUpdateAttributeDef,
} from "@/hooks/useCategories";
import type { AttributeDefinition, AttributeType } from "@ecommerce/types";

interface Props {
  categoryId: string;
  editing: AttributeDefinition | null;
  onClose: () => void;
}

const TYPES: { value: AttributeType; label: string; description: string }[] = [
  { value: "TEXT", label: "Text", description: "Free text input" },
  {
    value: "NUMBER",
    label: "Number",
    description: "Numeric value, supports range filter",
  },
  {
    value: "SELECT",
    label: "Single select",
    description: "One option from a list",
  },
  {
    value: "MULTI_SELECT",
    label: "Multi select",
    description: "Multiple options from a list",
  },
  { value: "BOOLEAN", label: "Yes / No", description: "Toggle switch" },
];

export function AttributeForm({ categoryId, editing, onClose }: Props) {
  const createAttr = useCreateAttributeDef(categoryId);
  const updateAttr = useUpdateAttributeDef(categoryId);

  const [name, setName] = useState("");
  const [type, setType] = useState<AttributeType>("TEXT");
  const [filterable, setFilterable] = useState(false);
  const [required, setRequired] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [optInput, setOptInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setFilterable(editing.filterable);
      setRequired(editing.required);
      setSortOrder(editing.sortOrder);
      setOptions(
        Array.isArray(editing.options) ? (editing.options as string[]) : [],
      );
    } else {
      setName("");
      setType("TEXT");
      setFilterable(false);
      setRequired(false);
      setSortOrder(0);
      setOptions([]);
    }
    setError("");
    setOptInput("");
  }, [editing]);

  function addOption() {
    const val = optInput.trim();
    if (!val || options.includes(val)) return;
    setOptions([...options, val]);
    setOptInput("");
  }

  function removeOption(opt: string) {
    setOptions(options.filter((o) => o !== opt));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const needsOptions = type === "SELECT" || type === "MULTI_SELECT";
    if (needsOptions && options.length === 0) {
      setError("Add at least one option for this type");
      return;
    }

    try {
      const payload = {
        name,
        type,
        options: needsOptions ? options : null,
        filterable,
        required,
        sortOrder,
      };

      if (editing) {
        await updateAttr.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createAttr.mutateAsync(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const loading = createAttr.isPending || updateAttr.isPending;
  const needsOptions = type === "SELECT" || type === "MULTI_SELECT";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-gray-900">
            {editing ? "Edit Attribute" : "New Attribute"}
          </h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Attribute Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Color, RAM, Brand"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    type === t.value
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                    className="accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400">{t.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Options (SELECT / MULTI_SELECT only) */}
          {needsOptions && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Options
              </label>
              <div className="flex gap-2">
                <input
                  value={optInput}
                  onChange={(e) => setOptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Type an option and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {options.map((opt) => (
                    <span
                      key={opt}
                      className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => removeOption(opt)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Preview */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Preview — how it appears on product form
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {name || "Attribute name"}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <AttributePreview type={type} options={options} name={name} />
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterable}
                onChange={(e) => setFilterable(e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Filterable</p>
                <p className="text-xs text-gray-400">Show in filter sidebar</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Required</p>
                <p className="text-xs text-gray-400">
                  Must be filled on product form
                </p>
              </div>
            </label>
          </div>

          {/* Sort order */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Sort Order
              <span className="text-gray-400 font-normal ml-1">
                (lower = shown first)
              </span>
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
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

// ─── Live preview of the attribute input ──────────────────────────────────────

function AttributePreview({
  type,
  options,
  name,
}: {
  type: AttributeType;
  options: string[];
  name: string;
}) {
  const placeholder = name || "Value";

  switch (type) {
    case "TEXT":
      return (
        <input
          disabled
          placeholder={`Enter ${placeholder.toLowerCase()}`}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-400 cursor-not-allowed"
        />
      );
    case "NUMBER":
      return (
        <input
          type="number"
          disabled
          placeholder="0"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-400 cursor-not-allowed"
        />
      );
    case "SELECT":
      return (
        <select
          disabled
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-400 cursor-not-allowed"
        >
          <option>
            {options.length > 0
              ? `Select ${placeholder.toLowerCase()}`
              : "Add options above"}
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case "MULTI_SELECT":
      return (
        <div className="flex flex-wrap gap-2">
          {options.length === 0 ? (
            <span className="text-xs text-gray-400">
              Add options above to preview
            </span>
          ) : (
            options.map((o) => (
              <span
                key={o}
                className="border border-gray-200 bg-white text-gray-400 text-xs px-3 py-1.5 rounded-full cursor-not-allowed"
              >
                {o}
              </span>
            ))
          )}
        </div>
      );
    case "BOOLEAN":
      return (
        <div className="flex items-center gap-2">
          <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
          <span className="text-sm text-gray-400">No</span>
        </div>
      );
  }
}
