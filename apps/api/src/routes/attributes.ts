import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate.middleware";
import {
  authenticate,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth.middleware";
import { attributeDefinitionSchema } from "@ecommerce/validators";
import { log } from "../middleware/logger.middleware";

const attributeRouter: Router = Router({ mergeParams: true }); // mergeParams to access :categoryId

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/categories/:categoryId/attributes
attributeRouter.get(
  "/",
  async (req: Request<{ categoryId: string }>, res: Response): Promise<void> => {
  try {
    const attributes = await prisma.attributeDefinition.findMany({
      where: { categoryId: req.params.categoryId },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ data: attributes });
  } catch (err) {
    log.error("attributes:list", "Failed to list attributes", err);
    res.status(500).json({ error: "Failed to fetch attributes" });
  }
  },
);

// ─── Admin only ───────────────────────────────────────────────────────────────

// POST /api/categories/:categoryId/attributes
attributeRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(attributeDefinitionSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const { name, type, options, filterable, required, sortOrder } = req.body;

      // validateMiddleware: SELECT and MULTI_SELECT must have options
      if (
        (type === "SELECT" || type === "MULTI_SELECT") &&
        (!options || options.length === 0)
      ) {
        res.status(400).json({
          error: "SELECT and MULTI_SELECT types require at least one option",
        });
        return;
      }

      // validateMiddleware category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      const attribute = await prisma.attributeDefinition.create({
        data: {
          categoryId,
          name,
          type,
          options: options ?? null,
          filterable,
          required,
          sortOrder,
        },
      });

      res.status(201).json({ data: attribute });
    } catch (err: any) {
      // Prisma unique constraint: same name in same category
      if (err.code === "P2002") {
        res
          .status(409)
          .json({ error: "Attribute name already exists in this category" });
        return;
      }
      log.error("attributes:create", "Failed to create attribute", err);
      res.status(500).json({ error: "Failed to create attribute" });
    }
  },
);

// PATCH /api/categories/:categoryId/attributes/:id
attributeRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(attributeDefinitionSchema.partial()),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, type, options, filterable, required, sortOrder } = req.body;

      if (
        type &&
        (type === "SELECT" || type === "MULTI_SELECT") &&
        (!options || options.length === 0)
      ) {
        res.status(400).json({
          error: "SELECT and MULTI_SELECT types require at least one option",
        });
        return;
      }

      const attribute = await prisma.attributeDefinition.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(options !== undefined && { options }),
          ...(filterable !== undefined && { filterable }),
          ...(required !== undefined && { required }),
          ...(sortOrder !== undefined && { sortOrder }),
        },
      });

      res.json({ data: attribute });
    } catch (err) {
      log.error("attributes:update", "Failed to update attribute", err);
      res.status(500).json({ error: "Failed to update attribute" });
    }
  },
);

// DELETE /api/categories/:categoryId/attributes/:id
attributeRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if any products use this attribute
      const usageCount = await prisma.productAttribute.count({
        where: { attributeDefId: id },
      });

      if (usageCount > 0) {
        res.status(400).json({
          error: `Cannot delete — ${usageCount} product(s) use this attribute`,
        });
        return;
      }

      await prisma.attributeDefinition.delete({ where: { id } });
      res.json({ message: "Attribute deleted" });
    } catch (err) {
      log.error("attributes:delete", "Failed to delete attribute", err);
      res.status(500).json({ error: "Failed to delete attribute" });
    }
  },
);

export default attributeRouter;
