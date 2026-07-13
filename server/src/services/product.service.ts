import { ProductStatus } from "@prisma/client";
import { prisma } from "../config/database";

export interface ProductFilters {
  category?: string;
  search?: string;
  organic?: boolean;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const { category, search, organic, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (category && category !== "all") {
    where.category = { slug: category };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { producer: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (organic !== undefined) where.organic = organic;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        producer: { select: { id: true, name: true, businessName: true, businessLocation: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      producer: { select: { id: true, name: true, businessName: true, businessLocation: true } },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { label: "asc" } });
}
