"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCategories, useAttributeDefs } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { ImageUploader } from "./ImageUploader";
import { slugify } from "@/lib/utils";
import type {
  Product,
  AttributeDefinition,
  ProductImage,
} from "@ecommerce/types";

interface Props {
  product?: Product; // if provided = edit mode
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const { data: categories = [] } = useCategories();

  // ── Core fields ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice ?? "");
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? false);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  // ── Dynamic attribute values ──────────────────────────────────────────────────
  // Map of attributeDefId → value string
  const [attrValues, setAttrValues] = useState<Record<string, string>>(() => {
    if (!product?.attributes) return {};
    return Object.fromEntries(
      product.attributes.map((a) => [a.attributeDefId, a.value]),
    );
  });

  // Fetch attribute definitions whenever category changes
  const { data: attrDefs = [] } = useAttributeDefs(categoryId);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugTouched && name) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Reset attribute values when category changes (different attrs)
  useEffect(() => {
    if (!product) setAttrValues({});
  }, [categoryId]);

  function setAttr(defId: string, value: string) {
    setAttrValues((prev) => ({ ...prev, [defId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required attributes
    const missingRequired = attrDefs.filter(
      (def) => def.required && !attrValues[def.id]?.trim(),
    );
    if (missingRequired.length > 0) {
      setError(
        `Required fields missing: ${missingRequired.map((d) => d.name).join(", ")}`,
      );
      return;
    }

    const payload = {
      name,
      slug,
      description: description || null,
      categoryId,
      basePrice: Number(basePrice),
      isVisible,
      stock: Number(stock),
      images,
      // Only send attributes that have a value
      attributes: Object.entries(attrValues)
        .filter(([, v]) => v.trim() !== "")
        .map(([attributeDefId, value]) => ({ attributeDefId, value })),
    };

    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, data: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const loading = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. iPhone 15 Pro"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Slug{" "}
              <span className="text-gray-400 font-normal">
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
              placeholder="e.g. iphone-15-pro"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the product..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing & inventory ────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing & Inventory</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Price (₹)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              min={0}
              step={0.01}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              required
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Visibility toggle */}
        <label className="flex items-center gap-3 cursor-pointer pt-1">
          <div
            onClick={() => setIsVisible(!isVisible)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              isVisible ? "bg-black" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                isVisible ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isVisible ? "Visible to customers" : "Hidden (draft)"}
            </p>
            <p className="text-xs text-gray-400">
              {isVisible
                ? "Product appears in the shop"
                : "Only you can see this product"}
            </p>
          </div>
        </label>
      </section>

      {/* ── Category + dynamic attributes ─────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Category & Attributes</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic attribute fields — rendered based on selected category */}
        {categoryId && attrDefs.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {attrDefs.length} attribute{attrDefs.length !== 1 ? "s" : ""} for
              this category
            </p>
            <div className="grid grid-cols-2 gap-4">
              {attrDefs.map((def) => (
                <DynamicAttributeField
                  key={def.id}
                  def={def}
                  value={attrValues[def.id] ?? ""}
                  onChange={(v) => setAttr(def.id, v)}
                />
              ))}
            </div>
          </div>
        )}

        {categoryId && attrDefs.length === 0 && (
          <p className="text-sm text-gray-400 pt-2">
            No attributes defined for this category.{" "}
            <a href="/admin/categories" className="text-black underline">
              Add attributes
            </a>
          </p>
        )}
      </section>

      {/* ── Images ────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <ImageUploader images={images} onChange={setImages} />
      </section>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : product ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

// ─── Renders the correct input based on attribute type ─────────────────────────

function DynamicAttributeField({
  def,
  value,
  onChange,
}: {
  def: AttributeDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black";

  const label = (
    <label className="text-sm font-medium text-gray-700 block mb-1">
      {def.name}
      {def.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (def.type) {
    case "TEXT":
      return (
        <div>
          {label}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            placeholder={`Enter ${def.name.toLowerCase()}`}
            className={baseClass}
          />
        </div>
      );

    case "NUMBER":
      return (
        <div>
          {label}
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            placeholder="0"
            className={baseClass}
          />
        </div>
      );

    case "SELECT":
      return (
        <div>
          {label}
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            className={`${baseClass} bg-white`}
          >
            <option value="">Select {def.name.toLowerCase()}</option>
            {(def.options as string[])?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "MULTI_SELECT": {
      // Stored as comma-separated string: "Red,Blue"
      const selected = value ? value.split(",") : [];
      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(next.join(","));
      };
      return (
        <div className="col-span-2">
          {label}
          <div className="flex flex-wrap gap-2">
            {(def.options as string[])?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected.includes(opt)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "BOOLEAN":
      return (
        <div>
          {label}
          <div className="flex gap-3">
            {["true", "false"].map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={def.id}
                  value={v}
                  checked={value === v}
                  onChange={() => onChange(v)}
                  className="accent-black"
                />
                <span className="text-sm text-gray-700">
                  {v === "true" ? "Yes" : "No"}
                </span>
              </label>
            ))}
          </div>
        </div>
      );
  }
}
