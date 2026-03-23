import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@ecommerce/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const primaryImg =
    product.images?.find((img: any) => img.isPrimary) ?? product.images?.[0];

  const reviews = product.reviews ?? [];
  const avgRating = reviews.length
    ? Math.round(
        (reviews.reduce((s: number, r: any) => s + r.rating, 0) /
          reviews.length) *
          10,
      ) / 10
    : null;

  const isLowStock = product.stock > 0 && product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {primaryImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImg.url}
              alt={primaryImg.alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badges */}
          {isOutOfStock && (
            <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full">
              Out of stock
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-1.5">
          <p className="text-xs text-gray-400">{product.category?.name}</p>

          <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-black">
            {product.name}
          </h3>

          {/* Dynamic attributes preview — show first 2 filterable ones */}
          {product.attributes?.slice(0, 2).map(
            (attr: any) =>
              attr.attributeDef?.filterable && (
                <p key={attr.id} className="text-xs text-gray-400">
                  {attr.attributeDef.name}:{" "}
                  <span className="text-gray-600">{attr.value}</span>
                </p>
              ),
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-gray-900">
              {formatPrice(product.basePrice)}
            </span>
            {avgRating && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-500">{avgRating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
