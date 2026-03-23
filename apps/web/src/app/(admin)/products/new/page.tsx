import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to create a new product
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
