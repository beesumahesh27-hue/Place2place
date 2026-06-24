import { prisma } from "../config/database";
import { startOrderRouting } from "./assignment.service";
import { createNotification } from "./notification.service";
import { logger } from "../utils/logger";

export interface OrderItemInput {
  productId: string;
  variant: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  userId: string;
  addressId?: string;
  items: OrderItemInput[];
  total: number;
  paymentMethod: string;
}

const LOW_STOCK_THRESHOLD = 5;

export async function createOrder(input: CreateOrderInput) {
  const order = await prisma.$transaction(async (tx) => {
    // Create order with items
    const newOrder = await tx.order.create({
      data: {
        userId:        input.userId,
        addressId:     input.addressId,
        total:         input.total,
        paymentMethod: input.paymentMethod,
        items:         { create: input.items },
      },
      include: { items: { include: { product: true } }, address: true },
    });

    // Deduct stock for each ordered item and update status
    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where:  { id: item.productId },
        select: { quantity: true, status: true },
      });
      if (!product) continue;

      const newQty = Math.max(0, product.quantity - item.quantity);
      const newStatus =
        newQty === 0                     ? "OUT_OF_STOCK" :
        newQty <= LOW_STOCK_THRESHOLD    ? "LOW_STOCK"    :
        product.status === "OUT_OF_STOCK" || product.status === "LOW_STOCK"
                                         ? "AVAILABLE"
                                         : product.status;

      await tx.product.update({
        where: { id: item.productId },
        data:  { quantity: newQty, status: newStatus as never },
      });
    }

    return newOrder;
  });

  // Start nearest-first routing after transaction (fire and forget)
  startOrderRouting(order.id).catch((err) => logger.error("startOrderRouting", err));

  return order;
}

export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where:   { userId },
    include: { items: { include: { product: true } }, address: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string, userId: string) {
  return prisma.order.findFirst({
    where:   { id, userId },
    include: { items: { include: { product: true } }, address: true },
  });
}

export async function confirmDelivery(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "OUT_FOR_DELIVERY" },
    include: {
      assignments: {
        where: { status: "ACCEPTED" },
        select: { producerId: true },
      },
    },
  });
  if (!order) return null;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED" },
  });

  for (const a of order.assignments) {
    createNotification(
      a.producerId,
      "order_delivered",
      "Order Delivered",
      `Customer confirmed delivery of order #${orderId.slice(0, 8).toUpperCase()}. Payment will be processed shortly.`,
      orderId
    ).catch((e) => logger.error("confirmDelivery notification", e));
  }

  return updated;
}

export async function updateOrderStatus(orderId: string, _status: string, producerId: string) {
  const products = await prisma.product.findMany({
    where:  { producerId },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  // Verify this producer owns at least one item in this order
  const order = await prisma.order.findFirst({
    where:   { id: orderId, items: { some: { productId: { in: productIds } } } },
    include: { items: true },
  });
  if (!order) return null;

  // Mark only this producer's items as accepted
  await prisma.orderItem.updateMany({
    where: { orderId, productId: { in: productIds } },
    data:  { accepted: true },
  });

  // Reload all items to check acceptance state
  const allItems = await prisma.orderItem.findMany({ where: { orderId } });
  const allAccepted = allItems.every((i) => i.accepted);
  const anyAccepted = allItems.some((i) => i.accepted);

  const currentOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, userId: true } });

  if (allAccepted) {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data:  { status: "PACKED" },
    });
    // Notify customer: all producers have accepted, order is being packed
    if (currentOrder) {
      createNotification(
        currentOrder.userId,
        "order_accepted",
        "Order Accepted & Being Packed",
        "Your order has been accepted by the producer and is now being packed.",
        orderId
      ).catch((e) => logger.error("createNotification (packed)", e));
    }
    return updated;
  }

  if (anyAccepted && currentOrder?.status === "CONFIRMED") {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data:  { status: "PROCESSING" },
    });
    if (currentOrder) {
      createNotification(
        currentOrder.userId,
        "order_accepted",
        "Order Accepted by Producer",
        "Your order has been accepted by the producer and is being processed.",
        orderId
      ).catch((e) => logger.error("createNotification (processing)", e));
    }
    return updated;
  }

  return prisma.order.findUnique({ where: { id: orderId } });
}
