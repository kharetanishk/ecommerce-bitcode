import { Resend } from "resend";
import type { Order } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "orders@bitcode.dev";

function formatPrice(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// ─── Order Confirmation ────────────────────────────────────────────────────────

export async function sendOrderConfirmation(params: {
  to: string;
  name: string;
  orderId: string;
  items: { name: string; quantity: number; price: string }[];
  total: string;
  shippingCharge: number;
  address: { line1: string; city: string; state: string; pincode: string };
  paymentMethod: string;
  deliveryDays: string;
}) {
  const itemRows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${i.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">×${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;font-weight:500;">${formatPrice(Number(i.price) * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Order Confirmed — #${params.orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#111827;">
        <div style="margin-bottom:24px;">
          <div style="width:32px;height:32px;background:#000;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <span style="color:#fff;font-size:12px;font-weight:700;">B</span>
          </div>
          <h1 style="font-size:22px;font-weight:600;margin:0 0 4px;">Order Confirmed!</h1>
          <p style="color:#6b7280;font-size:14px;margin:0;">Hi ${params.name}, your order has been placed successfully.</p>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-size:12px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Order ID</p>
          <p style="font-size:16px;font-weight:600;font-family:monospace;margin:0;">#${params.orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${itemRows}
        </table>

        <div style="border-top:2px solid #111827;padding-top:12px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#6b7280;margin-bottom:6px;">
            <span>Shipping</span>
            <span>${params.shippingCharge === 0 ? "Free" : formatPrice(params.shippingCharge)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:600;color:#111827;">
            <span>Total</span>
            <span>${formatPrice(params.total)}</span>
          </div>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="font-size:12px;font-weight:600;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Delivery Details</p>
          <p style="font-size:14px;color:#374151;margin:0 0 4px;">${params.address.line1}, ${params.address.city}</p>
          <p style="font-size:14px;color:#374151;margin:0 0 8px;">${params.address.state} — ${params.address.pincode}</p>
          <p style="font-size:13px;color:#6b7280;margin:0;">Estimated delivery: <strong>${params.deliveryDays}</strong></p>
          <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">Payment: <strong>${params.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}</strong></p>
        </div>

        <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
          You'll receive a tracking update once your order ships. — BitCode Store
        </p>
      </div>
    `,
  });
}

// ─── Status Update Email ───────────────────────────────────────────────────────

export async function sendStatusUpdate(params: {
  to: string;
  name: string;
  orderId: string;
  status: string;
  trackingUrl?: string;
  awbCode?: string;
  courierName?: string;
}) {
  const STATUS_MESSAGES: Record<string, { subject: string; body: string }> = {
    CONFIRMED: {
      subject: "Your order is confirmed",
      body: "We have confirmed your order and it is being prepared for dispatch.",
    },
    PROCESSING: {
      subject: "Your order is being packed",
      body: "Your order is being carefully packed and will be handed to the courier soon.",
    },
    SHIPPED: {
      subject: "Your order is on its way! 🚚",
      body: params.awbCode
        ? `Your order has been shipped via ${params.courierName ?? "our courier partner"}. Tracking ID: <strong>${params.awbCode}</strong>`
        : "Your order has been shipped and is on its way to you.",
    },
    DELIVERED: {
      subject: "Your order has been delivered ✓",
      body: "Your order has been delivered. We hope you love your purchase! Please leave a review.",
    },
    CANCELLED: {
      subject: "Your order has been cancelled",
      body: "Your order has been cancelled. If you paid online, a refund will be processed within 5-7 business days.",
    },
  };

  const content = STATUS_MESSAGES[params.status];
  if (!content) return; // skip unknown statuses

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `${content.subject} — #${params.orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#111827;">
        <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">${content.subject}</h1>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Hi ${params.name},</p>
        <p style="font-size:14px;color:#374151;margin:0 0 20px;" dangerouslySetInnerHTML="${content.body}"></p>

        ${
          params.trackingUrl
            ? `
          <a href="${params.trackingUrl}"
            style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;margin-bottom:20px;">
            Track Your Order
          </a>
        `
            : ""
        }

        <p style="font-size:13px;color:#9ca3af;margin:0;">Order #${params.orderId.slice(0, 8).toUpperCase()} — BitCode Store</p>
      </div>
    `,
  });
}
