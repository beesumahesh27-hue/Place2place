import { Request, Response } from "express";
import { ProductStatus } from "@prisma/client";
import { getProducts, getProductById, getCategories } from "../services/product.service";
import { ok, notFound, serverError } from "../utils/response";
import { logger } from "../utils/logger";

export async function listProducts(req: Request, res: Response) {
  try {
    const { category, search, organic, status, page, limit } = req.query;
    const result = await getProducts({
      category: category as string | undefined,
      search: search as string | undefined,
      organic: organic === "true" ? true : organic === "false" ? false : undefined,
      status: status as ProductStatus | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return ok(res, result);
  } catch (err) {
    logger.error("listProducts", err);
    return serverError(res);
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return notFound(res, "Product not found");
    return ok(res, product);
  } catch (err) {
    logger.error("getProduct", err);
    return serverError(res);
  }
}

export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await getCategories();
    return ok(res, categories);
  } catch (err) {
    logger.error("listCategories", err);
    return serverError(res);
  }
}
