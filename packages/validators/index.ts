import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const oauthSchema = z.object({
  provider: z.enum(["google"]),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

// ─── Category ─────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  parentId: z.string().uuid().nullable().optional(),
});

// ─── Attribute definition ─────────────────────────────────────────────────────

export const attributeDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "SELECT", "MULTI_SELECT", "BOOLEAN"]),
  options: z.array(z.string().min(1)).nullable().optional(),
  filterable: z.boolean().default(false),
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid(),
  basePrice: z.number().positive("Price must be positive"),
  isVisible: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string(),
        isPrimary: z.boolean(),
      }),
    )
    .default([]),
  attributes: z
    .array(
      z.object({
        attributeDefId: z.string().uuid(),
        value: z.string().min(1),
      }),
    )
    .default([]),
});

export const updateProductSchema = productSchema.partial();

// ─── Order ────────────────────────────────────────────────────────────────────

export const shippingAddressSchema = z.object({
  name: z.string().min(1),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "6-digit pincode required"),
});

export const orderSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

// ─── Review ───────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

// ─── Product filter (query string) ───────────────────────────────────────────

export const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
  sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  // JSON string: [{ defId: string, values: string[] }]
  attrs: z.string().optional(),
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100),
});

// ─── Inferred types (use these in both API + web) ─────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AttributeDefInput = z.infer<typeof attributeDefinitionSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProductFilterParams = z.infer<typeof productFilterSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
