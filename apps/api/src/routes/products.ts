import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate, validateQuery } from "../middleware/validate.middleware";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import {
  productSchema,
  updateProductSchema,
  productFilterSchema,
} from "@ecommerce/validators";
import {
  getFilteredProducts,
  productInclude,
} from "../services/product.service";
import { deleteFromR2 } from "../lib/r2";
import { log } from "../middleware/logger.middleware";
import { z } from "zod";

// Explicit type annotation avoids TS2742 portability errors in enterprise builds
const router: ReturnType<typeof Router> = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/products?categoryId=&minPrice=&maxPrice=&search=&attrs=&page=&limit=&sortBy=
router.get(
  "/",
  validateQuery(productFilterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        categoryId,
        minPrice,
        maxPrice,
        search,
        page,
        limit,
        sortBy,
        attrs,
      } = req.query as any;

      // attrs comes as a JSON string from query: '[{"defId":"...","values":["Red"]}]'
      let parsedAttrs: { defId: string; values: string[] }[] = [];
      if (attrs) {
        try {
          parsedAttrs = JSON.parse(attrs);
        } catch {
          /* ignore malformed */
        }
      }

      const result = await getFilteredProducts({
        categoryId,
        minPrice,
        maxPrice,
        search,
        attrs: parsedAttrs,
        page,
        limit,
        sortBy,
        adminView: false,
      });

      res.json(result);
    } catch (err) {
      log.error("products:list", "Failed to list products", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
);

// GET /api/products/:slug  (by slug — SEO friendly)
router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isVisible: true },
      include: productInclude,
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ data: product });
  } catch (err) {
    log.error("products:get", "Failed to fetch product", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/products/admin/all  — all products including hidden
router.get(
  "/admin/all",
  authenticate,
  requireAdmin,
  validateQuery(productFilterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        categoryId,
        minPrice,
        maxPrice,
        search,
        page,
        limit,
        sortBy,
        attrs,
      } = req.query as any;

      let parsedAttrs: { defId: string; values: string[] }[] = [];
      if (attrs) {
        try {
          parsedAttrs = JSON.parse(attrs);
        } catch {
          /* ignore */
        }
      }

      const result = await getFilteredProducts({
        categoryId,
        minPrice,
        maxPrice,
        search,
        attrs: parsedAttrs,
        page,
        limit,
        sortBy,
        adminView: true,
      });

      res.json(result);
    } catch (err) {
      log.error("products:admin-list", "Failed to list products (admin)", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
);

// GET /api/products/admin/:id  — fetch by ID (admin edit form)
router.get(
  "/admin/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: productInclude,
      });

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json({ data: product });
    } catch (err) {
      log.error("products:admin-get", "Failed to fetch product (admin)", err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },
);

// POST /api/products  — create product
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(productSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        name,
        slug,
        description,
        categoryId,
        basePrice,
        isVisible,
        stock,
        images,
        attributes,
      } = req.body;

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        res.status(409).json({ error: "Slug already in use" });
        return;
      }

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          categoryId,
          basePrice,
          isVisible,
          stock,
          images,
          // Create all attribute values in the same transaction
          attributes: {
            create: attributes.map(
              (a: { attributeDefId: string; value: string }) => ({
                attributeDefId: a.attributeDefId,
                value: a.value,
              }),
            ),
          },
        },
        include: productInclude,
      });

      res.status(201).json({ data: product });
    } catch (err) {
      log.error("products:create", "Failed to create product", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  },
);

// PATCH /api/products/:id  — update product
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateProductSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        slug,
        description,
        categoryId,
        basePrice,
        isVisible,
        stock,
        images,
        attributes,
      } = req.body;

      if (slug) {
        const conflict = await prisma.product.findFirst({
          where: { slug, NOT: { id } },
        });
        if (conflict) {
          res.status(409).json({ error: "Slug already in use" });
          return;
        }
      }

      const product = await prisma.$transaction(async (tx) => {
        // Delete existing attributes then recreate — simplest correct approach
        if (attributes !== undefined) {
          await tx.productAttribute.deleteMany({ where: { productId: id } });
        }

        return tx.product.update({
          where: { id },
          data: {
            ...(name !== undefined && { name }),
            ...(slug !== undefined && { slug }),
            ...(description !== undefined && { description }),
            ...(categoryId !== undefined && { categoryId }),
            ...(basePrice !== undefined && { basePrice }),
            ...(isVisible !== undefined && { isVisible }),
            ...(stock !== undefined && { stock }),
            ...(images !== undefined && { images }),
            ...(attributes !== undefined && {
              attributes: {
                create: attributes.map(
                  (a: { attributeDefId: string; value: string }) => ({
                    attributeDefId: a.attributeDefId,
                    value: a.value,
                  }),
                ),
              },
            }),
          },
          include: productInclude,
        });
      });

      res.json({ data: product });
    } catch (err) {
      log.error("products:update", "Failed to update product", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
);

// PATCH /api/products/:id/visibility  — toggle visibility only
router.patch(
  "/:id/visibility",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { isVisible } = z
        .object({ isVisible: z.boolean() })
        .parse(req.body);

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { isVisible },
        select: { id: true, isVisible: true, name: true },
      });

      res.json({ data: product });
    } catch (err) {
      log.error("products:visibility", "Failed to update product visibility", err);
      res.status(500).json({ error: "Failed to update visibility" });
    }
  },
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        select: { images: true },
      });

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // Delete images from R2
      const images = product.images as { url: string; key?: string }[];
      await Promise.allSettled(
        images.filter((img) => img.key).map((img) => deleteFromR2(img.key!)),
      );

      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ message: "Product deleted" });
    } catch (err) {
      log.error("products:delete", "Failed to delete product", err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
);

export default router;
