import axios from "axios";

const BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Shiprocket token expires every 24h — cache it in memory
// No need to store in DB or Redis for MVP
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await axios.post(`${BASE}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  cachedToken = res.data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  return cachedToken!;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface ShiprocketOrderPayload {
  orderId: string;
  orderDate: string; // "2024-01-15 10:30"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: {
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
  }[];
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  shippingCharge: number;
  weight: number; // kg — 0.5 per item is a safe default for MVP
}

// ─────────────────────────────────────────────────────────────────────────────
// Push order to Shiprocket → auto-assign best courier → return AWB
//
// ⚠️  DEV MODE: When NODE_ENV=development or SHIPROCKET_MOCK=true, this
//     function returns fake data and never calls the Shiprocket API.
//     This is intentional so you can test the full order flow locally
//     without creating real shipments in your Shiprocket account.
//
// 🚀  BEFORE GOING LIVE: Set SHIPROCKET_MOCK=false in your production
//     environment variables (Railway / Vercel). The mock block below will
//     be bypassed automatically. Do NOT delete the mock block — it is
//     useful for future local development and staging environments.
// ─────────────────────────────────────────────────────────────────────────────
export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload,
): Promise<{
  shiprocketOrderId: string;
  awbCode: string;
  courierName: string;
  trackingUrl: string;
}> {
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  DEV MOCK — returns fake AWB, skips real Shiprocket API call            ║
  // ║                                                                          ║
  // ║  CONTROLLED BY: SHIPROCKET_MOCK=true in apps/api/.env                  ║
  // ║  TO GO LIVE:    Set SHIPROCKET_MOCK=false in Railway env variables      ║
  // ║  DO NOT DELETE: Keep this block for local dev and staging               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (
    process.env.NODE_ENV === "development" ||
    process.env.SHIPROCKET_MOCK === "true"
  ) {
    const fakeAwb = `TEST${Date.now()}`;
    console.log(
      "\x1b[33m%s\x1b[0m",
      `[shiprocket:mock] Skipping real API call.`,
    );
    console.log("\x1b[33m%s\x1b[0m", `[shiprocket:mock] Fake AWB: ${fakeAwb}`);
    console.log(
      "\x1b[33m%s\x1b[0m",
      `[shiprocket:mock] Set SHIPROCKET_MOCK=false in .env to use real API.`,
    );

    return {
      shiprocketOrderId: `SR_MOCK_${Date.now()}`,
      awbCode: fakeAwb,
      courierName: "Mock Courier (Dev)",
      trackingUrl: `https://shiprocket.co/tracking/${fakeAwb}`,
    };
  }
  // ══════════════════ END DEV MOCK ═══════════════════════════════════════════

  // ── Step 1: Get auth token (cached for 23h) ───────────────────────────────
  const token = await getToken();

  // ── Step 2: Create order in Shiprocket ───────────────────────────────────
  // Maps our order structure to Shiprocket's expected payload format
  const body = {
    order_id: payload.orderId,
    order_date: payload.orderDate,
    pickup_location: "Primary", // must match a saved pickup address in Shiprocket dashboard
    channel_id: "",
    comment: "",
    billing_customer_name: payload.customerName,
    billing_last_name: "",
    billing_address: payload.shippingAddress.line1,
    billing_address_2: payload.shippingAddress.line2 ?? "",
    billing_city: payload.shippingAddress.city,
    billing_pincode: payload.shippingAddress.pincode,
    billing_state: payload.shippingAddress.state,
    billing_country: "India",
    billing_email: payload.customerEmail,
    billing_phone: payload.customerPhone,
    shipping_is_billing: true, // ship to billing address
    order_items: payload.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.sellingPrice,
      discount: 0,
      tax: 0,
      hsn: 0,
    })),
    payment_method: payload.paymentMethod, // 'Prepaid' or 'COD'
    shipping_charges: payload.shippingCharge,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: payload.subTotal,
    // Package dimensions — use conservative defaults for MVP
    // Update these per product category once you have real data
    length: 15, // cm
    breadth: 12, // cm
    height: 10, // cm
    weight: payload.weight, // kg
  };

  const createRes = await axios.post(`${BASE}/orders/create/adhoc`, body, {
    headers: authHeader(token),
  });

  const shiprocketOrderId = String(createRes.data.order_id);
  const shipmentId = String(createRes.data.shipment_id);

  // ── Step 3: Auto-assign best courier for the pincode ─────────────────────
  // Shiprocket picks the fastest/cheapest courier automatically
  // You can override this in the Shiprocket dashboard if needed
  const assignRes = await axios.post(
    `${BASE}/courier/assign/awb`,
    { shipment_id: shipmentId },
    { headers: authHeader(token) },
  );

  const awbCode = assignRes.data.response?.data?.awb_code ?? "";
  const courierName = assignRes.data.response?.data?.courier_name ?? "";

  // trackingUrl is the public page customers can visit to see live status
  const trackingUrl = awbCode
    ? `https://shiprocket.co/tracking/${awbCode}`
    : "";

  return { shiprocketOrderId, awbCode, courierName, trackingUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// Maps Shiprocket's status strings to our OrderStatus enum
// Called by the Shiprocket webhook handler in routes/orders.ts
// Add new mappings here as you discover Shiprocket sends other status strings
// ─────────────────────────────────────────────────────────────────────────────
export function mapShiprocketStatus(srStatus: string): string | null {
  const map: Record<string, string> = {
    NEW: "CONFIRMED",
    "READY TO SHIP": "PROCESSING",
    "PICKUP SCHEDULED": "PROCESSING",
    "PICKED UP": "PROCESSING",
    "IN TRANSIT": "SHIPPED",
    "OUT FOR DELIVERY": "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    "RTO INITIATED": "CANCELLED", // Return to origin — delivery failed
    "RTO DELIVERED": "CANCELLED", // Package returned to your warehouse
    LOST: "CANCELLED",
  };

  return map[srStatus.toUpperCase()] ?? null;
}
