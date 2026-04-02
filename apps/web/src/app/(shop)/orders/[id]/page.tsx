'use client'

import { use }                    from 'react'
import { useQuery }               from '@tanstack/react-query'
import { api }                    from '@/lib/api'
import { formatPrice }            from '@/lib/utils'
import { formatISTDate }          from '@/lib/date'
import Link                       from 'next/link'
import { ReturnRequestSection }   from '@/components/shop/ReturnRequestSection'
import type { Order }             from '@ecommerce/types'

const STATUS_STEPS = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED',
] as const

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Order Placed',
  CONFIRMED:  'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED:    'Shipped',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
  REFUNDED:   'Refunded',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-50 text-amber-700',
  CONFIRMED:  'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED:    'bg-indigo-50 text-indigo-700',
  DELIVERED:  'bg-green-50 text-green-700',
  CANCELLED:  'bg-red-50 text-red-700',
  REFUNDED:   'bg-gray-100 text-gray-600',
}

export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { id }      = use(params)
  const { success } = use(searchParams)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () =>
      api.get<{ data: Order }>(`/api/orders/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    )
  }

  const currentStep  = STATUS_STEPS.indexOf(order.status as any)
  const isFinalised  = order.status === 'CANCELLED' || order.status === 'REFUNDED'
  const addr         = order.shippingAddress as any
  const orderAny     = order as any

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

        {/* ── Success banner ─────────────────────────────────────────────── */}
        {success === 'true' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-1">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-green-800">Order Confirmed!</h1>
            <p className="text-green-600 text-sm">
              Thank you for your order. You'll receive updates as it progresses.
            </p>
          </div>
        )}

        {/* ── Order header ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {formatISTDate(order.createdAt)}
              </p>
              {/* Payment method badge */}
              {orderAny.paymentMethod && (
                <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  orderAny.paymentMethod === 'COD'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {orderAny.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                </span>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          {/* Progress tracker */}
          {!isFinalised && (
            <div className="mt-6">
              <div className="flex items-center">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        i <= currentStep
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {i < currentStep ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-xs whitespace-nowrap ${
                        i <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'
                      }`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                        i < currentStep ? 'bg-black' : 'bg-gray-100'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled / Refunded state */}
          {isFinalised && (
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-500 text-center">
                This order has been{' '}
                <span className="font-medium text-gray-700">
                  {order.status.toLowerCase()}
                </span>.
                {order.status === 'REFUNDED' && ' Your refund will be processed within 5–7 business days.'}
              </p>
            </div>
          )}
        </div>

        {/* ── AWB Shipment Tracking ──────────────────────────────────────── */}
        {orderAny.awbCode && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Shipment Tracking</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Courier</p>
                <p className="text-sm font-medium text-gray-900">
                  {orderAny.courierName ?? 'Partner Courier'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">AWB Number</p>
                <p className="text-sm font-mono font-medium text-gray-900">
                  {orderAny.awbCode}
                </p>
              </div>
            </div>

            {orderAny.trackingUrl && (
              <a
                href={orderAny.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Track on {orderAny.courierName ?? "Shiprocket"}
              </a>
            )}
          </div>
        )}

        {/* ── Items ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Items</h3>
          {order.items.map((item) => {
            const img = (item.product as any).images?.[0]
            return (
              <div key={item.id} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                </p>
              </div>
            )
          })}

          {/* Order totals */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(Number(order.total) - (orderAny.shippingCharge ?? 0))}</span>
            </div>
            {orderAny.shippingCharge !== undefined && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span className={orderAny.shippingCharge === 0 ? 'text-green-600' : ''}>
                  {orderAny.shippingCharge === 0 ? 'Free' : formatPrice(orderAny.shippingCharge)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-gray-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Shipping address ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
          <h3 className="font-semibold text-gray-900">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-900">{addr.name}</p>
            <p>{addr.phone}</p>
            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
            <p>{addr.city}, {addr.state} — {addr.pincode}</p>
          </div>
        </div>

        {/* ── Return request — only for DELIVERED orders ─────────────────── */}
        {order.status === 'DELIVERED' && (
          <ReturnRequestSection orderId={order.id} />
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link
            href="/orders"
            className="flex-1 border border-gray-300 text-gray-700 text-center rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            All Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 bg-black text-white text-center rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  )
}
