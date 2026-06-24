// Re-export Prisma-generated types so the rest of the codebase
// imports from a single place and stays decoupled from Prisma directly.
export type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Address,
  OtpToken,
  ProductStatus,
  OrderStatus,
} from "@prisma/client";
