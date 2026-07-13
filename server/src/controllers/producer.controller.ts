import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createProduct, updateProduct, deleteProduct,
  getProducerProducts, getProducerProduct,
  getProducerStats, getProducerOrders, getProducerNotifications,
  getProducerInventory, getProducerEarnings, advanceOrderStatus,
} from "../services/producer.service";
import { updateOrderStatus } from "../services/order.service";
import { acceptAssignment, declineAssignment } from "../services/assignment.service";
import { ok, created, notFound, badRequest, serverError } from "../utils/response";
import { logger } from "../utils/logger";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  unit: z.string().min(1),
  variants: z.preprocess((v) => (typeof v === "string" ? JSON.parse(v) : v), z.array(z.string())).optional().default([]),
  quantity: z.coerce.number().int().min(0),
  deliveryTime: z.string().min(1),
  organic: z.preprocess((v) => v === "true" || v === true, z.boolean()),
  categoryId: z.string().min(1),
  status: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "UPDATING"]).optional(),
});

export async function listMyProducts(req: AuthRequest, res: Response) {
  try {
    const products = await getProducerProducts(req.userId!);
    return ok(res, products);
  } catch (err) {
    logger.error("listMyProducts", err);
    return serverError(res);
  }
}

export async function getMyProduct(req: AuthRequest, res: Response) {
  try {
    const product = await getProducerProduct(req.params.id, req.userId!);
    if (!product) return notFound(res, "Product not found");
    return ok(res, product);
  } catch (err) {
    logger.error("getMyProduct", err);
    return serverError(res);
  }
}

export async function addProduct(req: AuthRequest, res: Response) {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error.errors.map((e) => e.message).join(", "));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const images = (files?.images ?? []).map((f) => f.path);
    const videos = (files?.videos ?? []).map((f) => f.path);

    const product = await createProduct({
      ...parsed.data,
      images,
      videos,
      producerId: req.userId!,
    });
    return created(res, product, "Product added");
  } catch (err) {
    logger.error("addProduct", err);
    return serverError(res);
  }
}

export async function editProduct(req: AuthRequest, res: Response) {
  try {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error.errors.map((e) => e.message).join(", "));

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const updates: Record<string, unknown> = { ...parsed.data };

    if (files?.images?.length) updates.images = files.images.map((f) => f.path);
    if (files?.videos?.length) updates.videos = files.videos.map((f) => f.path);

    const product = await updateProduct(req.params.id, req.userId!, updates);
    if (!product) return notFound(res, "Product not found or not yours");
    return ok(res, product, "Product updated");
  } catch (err) {
    logger.error("editProduct", err);
    return serverError(res);
  }
}

export async function removeProduct(req: AuthRequest, res: Response) {
  try {
    const result = await deleteProduct(req.params.id, req.userId!);
    if (!result) return notFound(res, "Product not found or not yours");
    return ok(res, null, "Product deleted");
  } catch (err) {
    logger.error("removeProduct", err);
    return serverError(res);
  }
}

export async function myStats(req: AuthRequest, res: Response) {
  try {
    const stats = await getProducerStats(req.userId!);
    return ok(res, stats);
  } catch (err) {
    logger.error("myStats", err);
    return serverError(res);
  }
}

export async function myOrders(req: AuthRequest, res: Response) {
  try {
    const orders = await getProducerOrders(req.userId!);
    return ok(res, orders);
  } catch (err) {
    logger.error("myOrders", err);
    return serverError(res);
  }
}

export async function acceptOrder(req: AuthRequest, res: Response) {
  try {
    const assigned = await acceptAssignment(req.params.id, req.userId!);
    if (!assigned) return notFound(res, "No active assignment found — order may have timed out or already accepted");

    const order = await updateOrderStatus(req.params.id, "PACKED", req.userId!);
    if (!order) return notFound(res, "Order not found or not yours");
    return ok(res, order, "Order accepted — now in packaging");
  } catch (err) {
    logger.error("acceptOrder", err);
    return serverError(res);
  }
}

export async function declineOrder(req: AuthRequest, res: Response) {
  try {
    const declined = await declineAssignment(req.params.id, req.userId!);
    if (!declined) return notFound(res, "No active assignment found for this order");
    return ok(res, null, "Order declined — routing to next nearest producer");
  } catch (err) {
    logger.error("declineOrder", err);
    return serverError(res);
  }
}

export async function myNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await getProducerNotifications(req.userId!);
    return ok(res, notifications);
  } catch (err) {
    logger.error("myNotifications", err);
    return serverError(res);
  }
}

export async function myInventory(req: AuthRequest, res: Response) {
  try {
    const inventory = await getProducerInventory(req.userId!);
    return ok(res, inventory);
  } catch (err) {
    logger.error("myInventory", err);
    return serverError(res);
  }
}

export async function myEarnings(req: AuthRequest, res: Response) {
  try {
    const earnings = await getProducerEarnings(req.userId!);
    return ok(res, earnings);
  } catch (err) {
    logger.error("myEarnings", err);
    return serverError(res);
  }
}

export async function shipOrder(req: AuthRequest, res: Response) {
  try {
    const result = await advanceOrderStatus(req.params.id, req.userId!);
    if (!result) return notFound(res, "Order not found or cannot be advanced");
    return ok(res, result, `Order status updated to ${result.status.replace(/_/g, " ")}`);
  } catch (err) {
    logger.error("shipOrder", err);
    return serverError(res);
  }
}
