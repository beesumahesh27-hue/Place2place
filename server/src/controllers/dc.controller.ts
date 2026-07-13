import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getDCProfile, getDCDeliveries, getDCStats, getDCFactories, acceptDelivery, completeDelivery } from "../services/dc.service";
import { ok, notFound, badRequest } from "../utils/response";

export async function profileHandler(req: AuthRequest, res: Response) {
  const profile = await getDCProfile(req.userId!);
  if (!profile) return notFound(res, "DC profile not found");
  return ok(res, profile);
}

export async function deliveriesHandler(_req: AuthRequest, res: Response) {
  const deliveries = await getDCDeliveries();
  return ok(res, deliveries);
}

export async function statsHandler(_req: AuthRequest, res: Response) {
  const stats = await getDCStats();
  return ok(res, stats);
}

export async function factoriesHandler(_req: AuthRequest, res: Response) {
  const factories = await getDCFactories();
  return ok(res, factories);
}

export async function acceptDeliveryHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!id) return badRequest(res, "Order ID required");
  const order = await acceptDelivery(id);
  return ok(res, order, "Order picked up — now in transit");
}

export async function completeDeliveryHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!id) return badRequest(res, "Order ID required");
  const order = await completeDelivery(id);
  return ok(res, order, "Delivery completed");
}
