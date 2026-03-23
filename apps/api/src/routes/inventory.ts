import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { z } from "zod";

const router: Router = Router();

// GET /api/inventory — all products with stock info
router.get(
  "/",
  authenticate,
  requireAdmin,
  async (_req, res: Response): Promise<void> => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          stock: true,
          isVisible: true,
          images: true,
          category: { select: { name: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { stock: "asc" }, // low stock first
      });

      res.json({ data: products });
    } catch (err) {
      console.error("[inventory:list]", err);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  },
);

// PATCH /api/inventory/:id — update stock for a single product
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { stock } = z
        .object({
          stock: z.number().int().min(0, "Stock cannot be negative"),
        })
        .parse(req.body);

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { stock },
        select: { id: true, name: true, stock: true },
      });

      res.json({ data: product });
    } catch (err) {
      console.error("[inventory:update]", err);
      res.status(500).json({ error: "Failed to update stock" });
    }
  },
);

export default router;
