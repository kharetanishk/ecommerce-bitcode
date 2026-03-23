import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export interface FilterInput {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  attrs?: { defId: string; values: string[] }[];
  page?: number;
  limit?: number;
  sortBy?: "newest" | "price_asc" | "price_desc";
  adminView?: boolean; // if true, include hidden products
}

// The full product include — used everywhere consistently
export const productInclude = {
  category: true,
  attributes: {
    include: { attributeDef: true },
    orderBy: { attributeDef: { sortOrder: "asc" } } as any,
  },
  reviews: {
    select: { rating: true },
  },
  _count: {
    select: { reviews: true },
  },
} satisfies Prisma.ProductInclude;

export async function getFilteredProducts(input: FilterInput) {
  const {
    categoryId,
    minPrice,
    maxPrice,
    search,
    attrs = [],
    page = 1,
    limit = 24,
    sortBy = "newest",
    adminView = false,
  } = input;

  const where: Prisma.ProductWhereInput = {
    // Admin sees everything, shop sees only visible products
    ...(!adminView && { isVisible: true }),

    ...(categoryId && { categoryId }),

    ...((minPrice !== undefined || maxPrice !== undefined) && {
      basePrice: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),

    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),

    // Each attribute filter = product MUST have a matching row
    // AND across filters (must match ALL), OR within values (any value matches)
    ...(attrs.length > 0 && {
      AND: attrs.map(({ defId, values }) => ({
        attributes: {
          some: {
            attributeDefId: defId,
            value: { in: values },
          },
        },
      })),
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "price_asc"
      ? { basePrice: "asc" }
      : sortBy === "price_desc"
        ? { basePrice: "desc" }
        : { createdAt: "desc" };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}

// Computed average rating from review rows
export function computeAvgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return (
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
    ) / 10
  );
}
