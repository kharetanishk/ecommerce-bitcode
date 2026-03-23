import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { z } from "zod";

const router = Router();

const returnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum([
    "WRONG_ITEM",
    "DAMAGED",
    "NOT_AS_DESCRIBED",
    "CHANGED_MIND",
    "QUALITY_ISSUE",
    "OTHER",
  ]),
  comments: z.string().max(500).optional(),
});

// POST /api/returns — create return request
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderId, reason, comments } = returnSchema.parse(req.body);
      const userId = req.user!.id;

      // Validate order belongs to user and is delivered
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order || order.userId !== userId) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (order.status !== "DELIVERED") {
        res.status(400).json({
          error: "Returns can only be requested for delivered orders",
        });
        return;
      }

      // Check return window (7 days)
      const deliveredAt = new Date(order.updatedAt);
      const daysSince =
        (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        res.status(400).json({
          error: "Return window has expired (7 days from delivery)",
        });
        return;
      }

      // One return request per order
      const existing = await prisma.returnRequest.findFirst({
        where: { orderId },
      });
      if (existing) {
        res
          .status(409)
          .json({ error: "A return request already exists for this order" });
        return;
      }

      const returnReq = await prisma.returnRequest.create({
        data: { orderId, userId, reason, comments },
      });

      res.status(201).json({ data: returnReq });
    } catch (err) {
      console.error("[returns:create]", err);
      res.status(500).json({ error: "Failed to create return request" });
    }
  },
);

// GET /api/returns — admin: all return requests
router.get(
  "/",
  authenticate,
  requireAdmin,
  async (_req, res: Response): Promise<void> => {
    try {
      const returns = await prisma.returnRequest.findMany({
        include: {
          order: { select: { id: true, total: true, paymentMethod: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: returns });
    } catch (err) {
      console.error("[returns:list]", err);
      res.status(500).json({ error: "Failed to fetch returns" });
    }
  },
);

// PATCH /api/returns/:id — admin: approve or reject
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = z
        .object({
          status: z.enum(["APPROVED", "REJECTED", "PICKED_UP", "REFUNDED"]),
        })
        .parse(req.body);

      const updated = await prisma.returnRequest.update({
        where: { id: req.params.id },
        data: { status },
      });

      res.json({ data: updated });
    } catch (err) {
      console.error("[returns:update]", err);
      res.status(500).json({ error: "Failed to update return request" });
    }
  },
);

export default router;
