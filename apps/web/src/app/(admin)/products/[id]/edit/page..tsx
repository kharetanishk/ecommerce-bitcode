"use client";

import { useAdminProduct } from "@/hooks/useProducts";
import { ProductForm } from "@/components/admin/ProductForm";
import { use } from "react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading } = useAdminProduct(id);

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-400">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-8 text-sm text-red-500">Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">{product.name}</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
