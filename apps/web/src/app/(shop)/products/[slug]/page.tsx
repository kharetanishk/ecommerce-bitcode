'use client'

import { useState, use }    from 'react'
import { useProduct }       from '@/hooks/useProducts'
import { formatPrice }      from '@/lib/utils'
import { useCartStore }     from '@/store/cart.store'
import { useAddToCart }     from '@/hooks/useCart'
import { ReviewSection }    from '@/components/shop/ReviewSection'

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug }                          = use(params)
  const { data: product, isLoading }      = useProduct(slug)
  const [selectedImage, setSelectedImage] = useState(0)

  // Cart
  const addToCartStore = useCartStore((s) => s.addItem)
  const openCart       = useCartStore((s) => s.openCart)
  const addToCart      = useAddToCart()

  async function handleAddToCart() {
    if (!product) return
    addToCartStore(product)
    openCart()
    addToCart.mutate({ productId: product.id, quantity: 1 })
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4 pt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-100 rounded animate-pulse"
                style={{ width: `${80 - i * 10}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Product not found</h1>
        <a href="/products" className="mt-4 inline-block text-black underline text-sm">
          ← Back to products
        </a>
      </div>
    )
  }

  const images    = product.images as any[]
  const reviews   = product.reviews as any[]
  const avgRating = reviews.length
    ? Math.round(
        (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10
      ) / 10
    : null

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Two column grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── Images ────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Primary image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
              {images[selectedImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-200"
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
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.url}
                    alt={img.alt}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-2 shrink-0 transition-colors ${
                      selectedImage === i
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ───────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Category + name + rating */}
            <div>
              <p className="text-sm text-gray-400 mb-1">{product.category?.name}</p>
              <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {avgRating && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(avgRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-500">
                    {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(product.basePrice)}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Dynamic attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-4 space-y-2.5">
                {product.attributes.map((attr: any) => (
                  <div key={attr.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">{attr.attributeDef?.name}</span>
                    <span className="text-gray-900 font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stock indicator */}
            <div>
              {product.stock === 0 ? (
                <p className="text-sm text-red-600 font-medium">Out of stock</p>
              ) : product.stock < 10 ? (
                <p className="text-sm text-amber-600 font-medium">
                  Only {product.stock} left in stock
                </p>
              ) : (
                <p className="text-sm text-green-600 font-medium">In stock</p>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCart.isPending}
              className="w-full bg-black text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.stock === 0
                ? 'Out of Stock'
                : addToCart.isPending
                ? 'Adding...'
                : 'Add to Cart'}
            </button>

            {/* Back link */}
            
              href="/products"
              className="block text-center text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back to products
            </a>
          </div>
        </div>

        {/* ── Reviews ─────────────────────────────────────────────────── */}
        {/* Sits below the two-column grid, full width inside max-w-6xl  */}
        <div className="mt-16 border-t border-gray-100 pt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">
            Customer Reviews
          </h2>
          <div className="max-w-2xl">
            <ReviewSection productId={product.id} />
          </div>
        </div>

      </div>
    </div>
  )
}