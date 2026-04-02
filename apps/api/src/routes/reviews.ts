import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate.middleware";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { reviewSchema } from "@ecommerce/validators";
import { log } from "../middleware/logger.middleware";

// Explicit type annotation avoids TS2742 portability errors in enterprise builds
const router: ReturnType<typeof Router> = Router({ mergeParams: true }); // access :productId from parent


// GET /api/products/:productId/reviews
router.get("/", async (req: Request<{ productId: string }>, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute aggregate stats
    const total = reviews.length;
    const avgRating = total
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) /
        10
      : null;

    // Rating distribution: { 5: 10, 4: 3, 3: 1, 2: 0, 1: 0 }
    const distribution = [5, 4, 3, 2, 1].reduce(
      (acc, star) => ({
        ...acc,
        [star]: reviews.filter((r) => r.rating === star).length,
      }),
      {} as Record<number, number>,
    );

    res.json({ data: reviews, meta: { total, avgRating, distribution } });
  } catch (err) {
    log.error("reviews:list", "Failed to list reviews", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/products/:productId/reviews
router.post(
  "/",
  authenticate,
  validate(reviewSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const userId = req.user!.id;
      const { rating, title, body } = req.body;

      // One review per user per product — enforced at DB level too
      const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      if (existing) {
        res
          .status(409)
          .json({ error: "You have already reviewed this product" });
        return;
      }

      // Validate product exists and is visible
      const product = await prisma.product.findFirst({
        where: { id: productId, isVisible: true },
      });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const review = await prisma.review.create({
        data: { userId, productId, rating, title, body },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      res.status(201).json({ data: review });
    } catch (err) {
      log.error("reviews:create", "Failed to create review", err);
      res.status(500).json({ error: "Failed to create review" });
    }
  },
);

// DELETE /api/products/:productId/reviews/:id
// User can delete their own review
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
      });

      if (!review) {
        res.status(404).json({ error: "Review not found" });
        return;
      }

      // Only owner or admin can delete
      if (review.userId !== req.user!.id && req.user!.role !== "ADMIN") {
        res.status(403).json({ error: "Not allowed" });
        return;
      }

      await prisma.review.delete({ where: { id: req.params.id } });
      res.json({ message: "Review deleted" });
    } catch (err) {
      log.error("reviews:delete", "Failed to delete review", err);
      res.status(500).json({ error: "Failed to delete review" });
    }
  },
);

export default router;
