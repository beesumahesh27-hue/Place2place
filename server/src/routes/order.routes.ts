import { Router } from "express";
import { z } from "zod";
import { placeOrder, listOrders, getOrder, confirmOrderDelivery } from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variant: z.string().optional().default(""),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z.object({
  addressId: z.string().cuid().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  total: z.number().positive(),
  paymentMethod: z.string().min(1),
});

router.use(authenticate);

router.post("/", validate(createOrderSchema), placeOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id/confirm-delivery", confirmOrderDelivery);

export default router;
