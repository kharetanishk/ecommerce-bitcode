export type ROLE = 'ADMIN' | 'CUSTOMER'
export type Role = ROLE

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'BOOLEAN'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  provider: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: Category[]
  attributeDefinitions?: AttributeDefinition[]
}

export interface AttributeDefinition {
  id: string
  categoryId: string
  name: string
  type: AttributeType
  options: string[] | null   // only for SELECT / MULTI_SELECT
  filterable: boolean
  required: boolean
  sortOrder: number
}

export interface ProductImage {
  url: string
  alt: string
  isPrimary: boolean
}

export interface ProductAttribute {
  id: string
  productId: string
  attributeDefId: string
  value: string
  attributeDef: AttributeDefinition
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  category: Category
  basePrice: string          // Prisma Decimal serialises as string
  isVisible: boolean
  stock: number
  images: ProductImage[]
  attributes: ProductAttribute[]
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  product: Product
}

export interface ShippingAddress {
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  priceSnapshot: string
  product: Product
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  total: string
  shippingAddress: ShippingAddress
  paymentId: string | null
  razorpayOrderId: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  user?: Pick<User, 'id' | 'email' | 'name'>
}


export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  title: string | null
  body: string | null
  createdAt: string
  user?: Pick<User, 'id' | 'name' | 'image'>
}




// ─── API shapes ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

export interface ApiSuccess<T = void> {
  message: string
  data?: T
}

// ─── Filter input (used on both client + server) ──────────────────────────────

export interface AttributeFilter {
  defId: string
  values: string[]
}

export interface ProductFilterInput {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  attrs?: AttributeFilter[]
  page?: number
  limit?: number
  sortBy?: 'newest' | 'price_asc' | 'price_desc'
}
