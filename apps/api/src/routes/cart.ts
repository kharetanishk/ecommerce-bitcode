import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate.middleware";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { cartItemSchema, updateCartItemSchema } from "@ecommerce/validators";

const router: Router = Router();

// All cart routes require authentication
// Guest cart lives in Zustand (localStorage) and syncs on login

const cartInclude = {
  product: {
    include: {
      category: true,
      attributes: { include: { attributeDef: true } },
    },
  },
};

// GET /api/cart
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const items = await prisma.cartItem.findMany({
        where: { userId: req.user!.id },
        include: cartInclude,
        orderBy: { id: "asc" },
      });

      const total = items.reduce(
        (sum, item) => sum + Number(item.product.basePrice) * item.quantity,
        0,
      );

      res.json({ data: { items, total } });
    } catch (err) {
      console.error("[cart:get]", err);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  },
);

// POST /api/cart/items — add or increment item
router.post(
  "/items",
  authenticate,
  validate(cartItemSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user!.id;

      // Validate product exists and is visible
      const product = await prisma.product.findFirst({
        where: { id: productId, isVisible: true },
      });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // Check stock
      if (product.stock < quantity) {
        res.status(400).json({
          error: `Only ${product.stock} item(s) in stock`,
        });
        return;
      }

      // Upsert — if already in cart, increment quantity
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      const newQty = (existing?.quantity ?? 0) + quantity;

      if (product.stock < newQty) {
        res.status(400).json({
          error: `Only ${product.stock} item(s) in stock`,
        });
        return;
      }

      const item = await prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity },
        update: { quantity: newQty },
        include: cartInclude,
      });

      res.status(201).json({ data: item });
    } catch (err) {
      console.error("[cart:add]", err);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  },
);

// PATCH /api/cart/items/:productId — update quantity
router.patch(
  "/items/:productId",
  authenticate,
  validate(updateCartItemSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { quantity } = req.body;
      const { productId } = req.params;
      const userId = req.user!.id;

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({ error: `Only ${product.stock} in stock` });
        return;
      }

      const item = await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity },
        include: cartInclude,
      });

      res.json({ data: item });
    } catch (err) {
      console.error("[cart:update]", err);
      res.status(500).json({ error: "Failed to update cart" });
    }
  },
);

// DELETE /api/cart/items/:productId — remove single item
router.delete(
  "/items/:productId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId: req.params.productId,
          },
        },
      });
      res.json({ message: "Item removed" });
    } catch (err) {
      console.error("[cart:remove]", err);
      res.status(500).json({ error: "Failed to remove item" });
    }
  },
);

// DELETE /api/cart — clear entire cart
router.delete(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
      res.json({ message: "Cart cleared" });
    } catch (err) {
      console.error("[cart:clear]", err);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  },
);

export default router;
