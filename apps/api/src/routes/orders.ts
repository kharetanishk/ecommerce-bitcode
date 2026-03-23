import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate.middleware";
import {
  createShiprocketOrder,
  mapShiprocketStatus,
} from "../services/shiprocket.service";
import {
  sendOrderConfirmation,
  sendStatusUpdate,
} from "../services/email.service";
import { checkDelivery } from "../services/delivery.service";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { orderSchema } from "@ecommerce/validators";
import { razorpay, verifyPaymentSignature } from "../lib/razorpay";
import { z } from "zod";

const router: Router = Router();

const orderInclude = {
  items: {
    include: {
      product: {
        include: { images: false, category: true },
      },
    },
  },
  user: {
    select: { id: true, email: true, name: true },
  },
};

// ─── User routes ──────────────────────────────────────────────────────────────

// GET /api/orders/my — user's order history
router.get(
  "/my",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: req.user!.id },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: orders });
    } catch (err) {
      console.error("[orders:my]", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// GET /api/orders/:id — single order (owner or admin)
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: orderInclude,
      });

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Only owner or admin can view
      if (order.userId !== req.user!.id && req.user!.role !== "ADMIN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json({ data: order });
    } catch (err) {
      console.error("[orders:get]", err);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  },
);

// POST /api/orders — create order from cart + Razorpay order
router.post(
  "/",
  authenticate,
  validate(orderSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { shippingAddress, paymentMethod = "ONLINE" } = req.body;

      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        res.status(400).json({ error: "Cart is empty" });
        return;
      }

      // Validate stock
      for (const item of cartItems) {
        if (!item.product.isVisible) {
          res
            .status(400)
            .json({ error: `"${item.product.name}" is no longer available` });
          return;
        }
        if (item.product.stock < item.quantity) {
          res.status(400).json({
            error: `Only ${item.product.stock} of "${item.product.name}" in stock`,
          });
          return;
        }
      }

      const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.product.basePrice) * item.quantity,
        0,
      );

      // Get delivery info for shipping charge
      const delivery = await checkDelivery(shippingAddress.pincode, subtotal);
      const shippingCharge = delivery.shippingCharge;

      if (!delivery.serviceable) {
        res.status(400).json({ error: delivery.message });
        return;
      }

      const total = subtotal + shippingCharge;

      // ── COD flow — no Razorpay ─────────────────────────────────────────────
      if (paymentMethod === "COD") {
        const order = await prisma.$transaction(async (tx) => {
          for (const item of cartItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }

          const newOrder = await tx.order.create({
            data: {
              userId,
              total,
              shippingCharge,
              shippingAddress,
              status: "CONFIRMED", // COD is auto-confirmed
              paymentMethod: "COD",
              codStatus: "PENDING",
              items: {
                create: cartItems.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  priceSnapshot: item.product.basePrice,
                })),
              },
            },
            include: orderInclude,
          });

          await tx.cartItem.deleteMany({ where: { userId } });
          return newOrder;
        });

        // Push to Shiprocket
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });

          const srResult = await createShiprocketOrder({
            orderId: order.id,
            orderDate: new Date().toISOString().slice(0, 16).replace("T", " "),
            customerName: user?.name ?? "Customer",
            customerEmail: user?.email ?? "",
            customerPhone: (shippingAddress as any).phone,
            shippingAddress: {
              line1: (shippingAddress as any).line1,
              line2: (shippingAddress as any).line2,
              city: (shippingAddress as any).city,
              state: (shippingAddress as any).state,
              pincode: (shippingAddress as any).pincode,
              country: "India",
            },
            items: cartItems.map((item) => ({
              name: item.product.name,
              sku: item.product.slug,
              units: item.quantity,
              sellingPrice: Number(item.product.basePrice),
            })),
            paymentMethod: "COD",
            subTotal: subtotal,
            shippingCharge: shippingCharge,
            weight: cartItems.length * 0.5,
          });

          await prisma.order.update({
            where: { id: order.id },
            data: {
              shiprocketOrderId: srResult.shiprocketOrderId,
              awbCode: srResult.awbCode,
              trackingUrl: srResult.trackingUrl,
              courierName: srResult.courierName,
            },
          });
        } catch (srErr) {
          // Don't fail the order if Shiprocket fails — admin can retry
          console.error("[shiprocket:push]", srErr);
        }

        // Send confirmation email
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });
          await sendOrderConfirmation({
            to: user!.email,
            name: user?.name ?? "Customer",
            orderId: order.id,
            items: cartItems.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              price: String(i.product.basePrice),
            })),
            total: String(total),
            shippingCharge: shippingCharge,
            address: shippingAddress as any,
            paymentMethod: "COD",
            deliveryDays: delivery.deliveryDays ?? "5-7 business days",
          });
        } catch (emailErr) {
          console.error("[email:confirmation]", emailErr);
        }

        res.status(201).json({ data: order });
        return;
      }

      // ── Online payment flow — Razorpay ─────────────────────────────────────
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
      });

      const order = await prisma.$transaction(async (tx) => {
        for (const item of cartItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        return tx.order.create({
          data: {
            userId,
            total,
            shippingCharge,
            shippingAddress,
            status: "PENDING",
            paymentMethod: "ONLINE",
            razorpayOrderId: razorpayOrder.id,
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceSnapshot: item.product.basePrice,
              })),
            },
          },
          include: orderInclude,
        });
      });

      res.status(201).json({
        data: {
          order,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (err) {
      console.error("[orders:create]", err);
      res.status(500).json({ error: "Failed to create order" });
    }
  },
);

// POST /api/orders/:id/verify-payment
router.post(
  "/:id/verify-payment",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = z
        .object({
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
        .parse(req.body);

      const valid = verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!valid) {
        res.status(400).json({ error: "Invalid payment signature" });
        return;
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, user: true },
      });

      if (!order || order.userId !== req.user!.id) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { userId: req.user!.id } });
        return tx.order.update({
          where: { id },
          data: { status: "CONFIRMED", paymentId: razorpayPaymentId },
          include: orderInclude,
        });
      });

      // Push to Shiprocket async
      createShiprocketOrder({
        orderId: order.id,
        orderDate: new Date().toISOString().slice(0, 16).replace("T", " "),
        customerName: (order.user as any)?.name ?? "Customer",
        customerEmail: (order.user as any)?.email ?? "",
        customerPhone: (order.shippingAddress as any).phone,
        shippingAddress: {
          line1: (order.shippingAddress as any).line1,
          line2: (order.shippingAddress as any).line2,
          city: (order.shippingAddress as any).city,
          state: (order.shippingAddress as any).state,
          pincode: (order.shippingAddress as any).pincode,
          country: "India",
        },
        items: order.items.map((item) => ({
          name: item.product.name,
          sku: item.product.slug,
          units: item.quantity,
          sellingPrice: Number(item.priceSnapshot),
        })),
        paymentMethod: "Prepaid",
        subTotal: Number(order.total) - Number(order.shippingCharge ?? 0),
        shippingCharge: Number(order.shippingCharge ?? 0),
        weight: order.items.length * 0.5,
      })
        .then((sr) =>
          prisma.order.update({
            where: { id },
            data: {
              shiprocketOrderId: sr.shiprocketOrderId,
              awbCode: sr.awbCode,
              trackingUrl: sr.trackingUrl,
              courierName: sr.courierName,
            },
          }),
        )
        .catch((err) => console.error("[shiprocket:push]", err));

      // Send confirmation email async
      sendOrderConfirmation({
        to: (order.user as any).email,
        name: (order.user as any)?.name ?? "Customer",
        orderId: order.id,
        items: order.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: String(i.priceSnapshot),
        })),
        total: String(order.total),
        shippingCharge: Number(order.shippingCharge ?? 0),
        address: order.shippingAddress as any,
        paymentMethod: "ONLINE",
        deliveryDays: "3-5 business days",
      }).catch((err) => console.error("[email:confirmation]", err));

      res.json({ data: updated });
    } catch (err) {
      console.error("[orders:verify]", err);
      res.status(500).json({ error: "Payment verification failed" });
    }
  },
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/orders — all orders (admin)
router.get(
  "/",
  authenticate,
  requireAdmin,
  async (_req, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: orders });
    } catch (err) {
      console.error("[orders:admin-list]", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// PATCH /api/orders/:id/status — admin updates delivery status
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = z
        .object({
          status: z.enum([
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ]),
        })
        .parse(req.body);

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
        include: orderInclude,
      });

      res.json({ data: order });
    } catch (err) {
      console.error("[orders:status]", err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
);

router.post(
  "/webhook/shiprocket",
  async (
    req: Request<{}, any, { awb?: string; current_status?: string; order_id?: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const { awb, current_status, order_id } = req.body;

      if (!awb && !order_id) {
        res.status(400).json({ error: "Missing AWB or order ID" });
        return;
      }

      const ourStatus = mapShiprocketStatus(current_status ?? "");
      if (!ourStatus) {
        res.json({ message: "Status not mapped, ignored" });
        return;
      }

      // Find order by AWB code
      const order = await prisma.order.findFirst({
        where: { awbCode: awb ?? undefined },
        include: { user: true },
      });

      if (!order) {
        res.json({ message: "Order not found, ignored" });
        return;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: ourStatus as any },
      });

      // Send status email
      sendStatusUpdate({
        to: (order.user as any).email,
        name: (order.user as any)?.name ?? "Customer",
        orderId: order.id,
        status: ourStatus,
        trackingUrl: order.trackingUrl ?? undefined,
        awbCode: order.awbCode ?? undefined,
        courierName: order.courierName ?? undefined,
      }).catch((err) => console.error("[email:status]", err));

      res.json({ message: "Status updated" });
    } catch (err) {
      console.error("[webhook:shiprocket]", err);
      res.status(500).json({ error: "Webhook failed" });
    }
  },
);

// ─── Razorpay Refund ──────────────────────────────────────────────────────────
router.post(
  "/:id/refund",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
      });

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (!order.paymentId) {
        res.status(400).json({ error: "No payment found for this order" });
        return;
      }

      if (order.paymentMethod === "COD") {
        res
          .status(400)
          .json({ error: "COD orders cannot be refunded via Razorpay" });
        return;
      }

      // Issue full refund
      await razorpay.payments.refund(order.paymentId, {
        amount: Math.round(Number(order.total) * 100), // paise
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });

      // Send email
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true, name: true },
      });

      sendStatusUpdate({
        to: user!.email,
        name: user?.name ?? "Customer",
        orderId: order.id,
        status: "CANCELLED",
      }).catch(console.error);

      res.json({ message: "Refund initiated successfully" });
    } catch (err) {
      console.error("[orders:refund]", err);
      res.status(500).json({ error: "Failed to process refund" });
    }
  },
);
export default router;
