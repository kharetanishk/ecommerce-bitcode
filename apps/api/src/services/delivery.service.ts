import { prisma } from "../lib/prisma";

export interface DeliveryInfo {
  serviceable: boolean;
  zone: "A" | "B" | "C" | "X" | null;
  city: string | null;
  state: string | null;
  deliveryDays: string | null;
  shippingCharge: number;
  freeAbove: number | null;
  message: string;
}

const ZONE_CONFIG = {
  A: { deliveryDays: "1-2 business days", freeAbove: 500, flatRate: 49 },
  B: { deliveryDays: "3-5 business days", freeAbove: 999, flatRate: 79 },
  C: { deliveryDays: "5-7 business days", freeAbove: 1499, flatRate: 99 },
  X: { deliveryDays: null, freeAbove: null, flatRate: 0 },
};

export async function checkDelivery(
  pincode: string,
  orderTotal = 0,
): Promise<DeliveryInfo> {
  // Validate pincode format
  if (!/^\d{6}$/.test(pincode)) {
    return {
      serviceable: false,
      zone: null,
      city: null,
      state: null,
      deliveryDays: null,
      shippingCharge: 0,
      freeAbove: null,
      message: "Enter a valid 6-digit pincode",
    };
  }

  const record = await prisma.pincode.findUnique({ where: { pincode } });

  // Unknown pincode — treat as Zone C (most of India is serviceable)
  if (!record) {
    const config = ZONE_CONFIG.C;
    const charge = orderTotal >= config.freeAbove ? 0 : config.flatRate;
    return {
      serviceable: true,
      zone: "C",
      city: null,
      state: null,
      deliveryDays: config.deliveryDays,
      shippingCharge: charge,
      freeAbove: config.freeAbove,
      message: `Delivery in ${config.deliveryDays}`,
    };
  }

  if (!record.isServiceable || record.zone === "X") {
    return {
      serviceable: false,
      zone: "X",
      city: record.city,
      state: record.state,
      deliveryDays: null,
      shippingCharge: 0,
      freeAbove: null,
      message: `Sorry, we don't deliver to ${record.city} yet`,
    };
  }

  const config = ZONE_CONFIG[record.zone as "A" | "B" | "C"];
  const charge = orderTotal >= config.freeAbove ? 0 : config.flatRate;

  return {
    serviceable: true,
    zone: record.zone as "A" | "B" | "C",
    city: record.city,
    state: record.state,
    deliveryDays: config.deliveryDays,
    shippingCharge: charge,
    freeAbove: config.freeAbove,
    message:
      charge === 0
        ? `Free delivery · ${config.deliveryDays}`
        : `₹${charge} delivery · ${config.deliveryDays}`,
  };
}
