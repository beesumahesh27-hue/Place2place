import { Response } from "express";
import { createOrder, getOrdersByUser, getOrderById, confirmDelivery } from "../services/order.service";
import { ok, created, notFound, serverError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

export async function placeOrder(req: AuthRequest, res: Response) {
  try {
    const order = await createOrder({ ...req.body, userId: req.userId! });
    return created(res, order, "Order placed successfully");
  } catch (err) {
    logger.error("placeOrder", err);
    return serverError(res);
  }
}

export async function listOrders(req: AuthRequest, res: Response) {
  try {
    const orders = await getOrdersByUser(req.userId!);
    return ok(res, orders);
  } catch (err) {
    logger.error("listOrders", err);
    return serverError(res);
  }
}

export async function getOrder(req: AuthRequest, res: Response) {
  try {
    const order = await getOrderById(req.params.id, req.userId!);
    if (!order) return notFound(res, "Order not found");
    return ok(res, order);
  } catch (err) {
    logger.error("getOrder", err);
    return serverError(res);
  }
}

export async function confirmOrderDelivery(req: AuthRequest, res: Response) {
  try {
    const updated = await confirmDelivery(req.params.id, req.userId!);
    if (!updated) return notFound(res, "Order not found or not eligible for delivery confirmation");
    return ok(res, updated, "Delivery confirmed — thank you!");
  } catch (err) {
    logger.error("confirmOrderDelivery", err);
    return serverError(res);
  }
}
