import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate.middleware";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { categorySchema } from "@ecommerce/validators";
import { log } from "../middleware/logger.middleware";

const categoryRouter: Router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/categories
// Returns flat list — used in dropdowns
categoryRouter.get("/", async (_req, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ data: categories });
  } catch (err) {
    log.error("categories:list", "Failed to list categories", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/tree
// Returns nested tree with attributeDefinitions — used by filter sidebar + product form
categoryRouter.get("/tree", async (_req, res: Response): Promise<void> => {
  try {
    const all = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        attributeDefinitions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Build tree in memory — avoids recursive SQL
    const map = new Map(
      all.map((c) => [c.id, { ...c, children: [] as typeof all }]),
    );

    const roots: typeof all = [];
    for (const cat of all) {
      if (cat.parentId) {
        map.get(cat.parentId)?.children.push(map.get(cat.id)!);
      } else {
        roots.push(map.get(cat.id)!);
      }
    }

    res.json({ data: roots });
  } catch (err) {
    log.error("categories:tree", "Failed to load category tree", err);
    res.status(500).json({ error: "Failed to fetch category tree" });
  }
});

// GET /api/categories/:id
categoryRouter.get("/:id", async (req, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        attributeDefinitions: { orderBy: { sortOrder: "asc" } },
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json({ data: category });
  } catch (err) {
    log.error("categories:get", "Failed to fetch category", err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// ─── Admin only ───────────────────────────────────────────────────────────────

// POST /api/categories
categoryRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(categorySchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, slug, parentId } = req.body;

      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) {
        res.status(409).json({ error: "Slug already in use" });
        return;
      }

      const category = await prisma.category.create({
        data: { name, slug, parentId: parentId ?? null },
        include: { attributeDefinitions: true },
      });

      res.status(201).json({ data: category });
    } catch (err) {
      log.error("categories:create", "Failed to create category", err);
      res.status(500).json({ error: "Failed to create category" });
    }
  },
);

// PATCH /api/categories/:id
categoryRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(categorySchema.partial()),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, parentId } = req.body;

      // Prevent a category from becoming its own parent
      if (parentId === id) {
        res.status(400).json({ error: "Category cannot be its own parent" });
        return;
      }

      if (slug) {
        const conflict = await prisma.category.findFirst({
          where: { slug, NOT: { id } },
        });
        if (conflict) {
          res.status(409).json({ error: "Slug already in use" });
          return;
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(parentId !== undefined && { parentId: parentId ?? null }),
        },
        include: { attributeDefinitions: true },
      });

      res.json({ data: category });
    } catch (err) {
      log.error("categories:update", "Failed to update category", err);
      res.status(500).json({ error: "Failed to update category" });
    }
  },
);

// DELETE /api/categories/:id
categoryRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Block delete if products exist under this category
      const productCount = await prisma.product.count({
        where: { categoryId: id },
      });
      if (productCount > 0) {
        res.status(400).json({
          error: `Cannot delete — ${productCount} product(s) use this category`,
        });
        return;
      }

      await prisma.category.delete({ where: { id } });
      res.json({ message: "Category deleted" });
    } catch (err) {
      log.error("categories:delete", "Failed to delete category", err);
      res.status(500).json({ error: "Failed to delete category" });
    }
  },
);

export default categoryRouter;
