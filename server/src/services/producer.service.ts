import { ProductStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { createNotification } from "./notification.service";

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  unit: string;
  variants: string[];
  images: string[];
  videos: string[];
  quantity: number;
  deliveryTime: string;
  organic: boolean;
  categoryId: string;
  producerId: string;
}

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, "producerId">> {
  status?: ProductStatus;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: input,
    include: { category: true },
  });
}

export async function updateProduct(id: string, producerId: string, input: UpdateProductInput) {
  // Ensure the producer owns this product
  const existing = await prisma.product.findFirst({ where: { id, producerId } });
  if (!existing) return null;

  return prisma.product.update({
    where: { id },
    data: input,
    include: { category: true },
  });
}

export async function deleteProduct(id: string, producerId: string) {
  const existing = await prisma.product.findFirst({ where: { id, producerId } });
  if (!existing) return null;
  return prisma.product.delete({ where: { id } });
}

export async function getProducerProducts(producerId: string) {
  return prisma.product.findMany({
    where: { producerId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProducerProduct(id: string, producerId: string) {
  return prisma.product.findFirst({
    where: { id, producerId },
    include: { category: true },
  });
}

export async function getProducerStats(producerId: string) {
  const products = await prisma.product.findMany({
    where: { producerId },
    select: { id: true, quantity: true, price: true },
  });

  const productIds = products.map((p) => p.id);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);

  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: { quantity: true, price: true, orderId: true },
  });

  const totalRevenue = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalOrders = new Set(orderItems.map((i) => i.orderId)).size;

  return { totalProducts, totalStock, totalRevenue, totalOrders };
}

export async function getProducerNotifications(producerId: string) {
  // Stock alerts
  const products = await prisma.product.findMany({
    where:  { producerId, status: { in: ["LOW_STOCK" as never, "OUT_OF_STOCK" as never] } },
    select: { id: true, name: true, quantity: true, unit: true, status: true, images: true },
    orderBy: { updatedAt: "desc" },
  });

  const stockNotifs = products.map((p) => ({
    type:        "stock" as const,
    productId:   p.id,
    productName: p.name,
    quantity:    p.quantity,
    unit:        p.unit,
    status:      p.status,
    image:       p.images[0] ?? null,
    urgent:      p.status === "OUT_OF_STOCK",
    message:
      p.status === "OUT_OF_STOCK"
        ? `${p.name} is out of stock. Add new stock to resume selling.`
        : `${p.name} is running low — only ${p.quantity} ${p.unit} left. Please update the quantity.`,
  }));

  // Pending order assignment alerts
  const pendingAssignments = await prisma.orderAssignment.findMany({
    where: { producerId, status: "PENDING" },
    include: {
      order: {
        include: {
          user:  { select: { name: true } },
          items: { include: { product: { select: { name: true, images: true, unit: true } } } },
        },
      },
    },
    orderBy: { notifiedAt: "desc" },
  });

  const orderNotifs = pendingAssignments.map((a) => ({
    type:      "order" as const,
    orderId:   a.orderId,
    customer:  a.order.user.name,
    itemCount: a.order.items.length,
    expiresAt: a.expiresAt?.toISOString() ?? null,
    urgent:    true,
    message:   `New order from ${a.order.user.name} — ${a.order.items.length} item${a.order.items.length > 1 ? "s" : ""}. Accept within 5 minutes.`,
  }));

  // Stored DB notifications — delivery confirmations sent from customer
  const storedNotifs = await prisma.notification.findMany({
    where:   { userId: producerId, type: "order_delivered" },
    orderBy: { createdAt: "desc" },
    take:    10,
  });

  const deliveredNotifs = storedNotifs.map((n) => ({
    type:      "delivered" as const,
    id:        n.id,
    orderId:   n.referenceId ?? "",
    title:     n.title,
    message:   n.message,
    read:      n.read,
    createdAt: n.createdAt.toISOString(),
    urgent:    false,
  }));

  return [...orderNotifs, ...deliveredNotifs, ...stockNotifs];
}

export async function getProducerInventory(producerId: string) {
  const products = await prisma.product.findMany({
    where: { producerId },
    include: {
      category: true,
      orderItems: { select: { quantity: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => {
    const soldQty = p.orderItems.reduce((s, i) => s + i.quantity, 0);
    const revenue = p.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      id:           p.id,
      name:         p.name,
      unit:         p.unit,
      price:        p.price,
      status:       p.status,
      category:     p.category,
      image:        p.images[0] ?? null,
      remainingQty: p.quantity,
      soldQty,
      uploadedQty:  p.quantity + soldQty,
      revenue,
    };
  });
}

export async function getProducerEarnings(producerId: string) {
  const products = await prisma.product.findMany({
    where: { producerId },
    include: {
      category: true,
      orderItems: {
        select: { quantity: true, price: true, orderId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p) => {
    const soldQty = p.orderItems.reduce((s, i) => s + i.quantity, 0);
    const revenue = p.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderCount = new Set(p.orderItems.map((i) => i.orderId)).size;
    return {
      id:         p.id,
      name:       p.name,
      unit:       p.unit,
      category:   p.category.label,
      image:      p.images[0] ?? null,
      soldQty,
      revenue,
      orderCount,
    };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalSold    = rows.reduce((s, r) => s + r.soldQty, 0);
  return { rows, totalRevenue, totalSold };
}

const VALID_ADVANCE = new Map([
  ["PACKED",           "OUT_FOR_DELIVERY"],
  ["OUT_FOR_DELIVERY", "DELIVERED"],
]);

export async function advanceOrderStatus(orderId: string, producerId: string) {
  // Verify producer has accepted assignment for this order
  const assignment = await prisma.orderAssignment.findFirst({
    where: { orderId, producerId, status: "ACCEPTED" },
  });
  if (!assignment) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, userId: true },
  });
  if (!order) return null;

  const nextStatus = VALID_ADVANCE.get(order.status);
  if (!nextStatus) return null;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus as never },
  });

  const notifTitle =
    nextStatus === "OUT_FOR_DELIVERY" ? "Order Shipped" : "Order Delivered";
  const notifMsg =
    nextStatus === "OUT_FOR_DELIVERY"
      ? "Your order is out for delivery and will arrive soon."
      : "Your order has been delivered. Enjoy your purchase!";

  createNotification(order.userId, nextStatus === "OUT_FOR_DELIVERY" ? "order_shipped" : "order_delivered", notifTitle, notifMsg, orderId)
    .catch(() => { /* silent */ });

  return updated;
}

export async function getProducerOrders(producerId: string) {
  const products = await prisma.product.findMany({
    where: { producerId },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  // Only surface orders where this producer has an active assignment
  const assignments = await prisma.orderAssignment.findMany({
    where: {
      producerId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    include: {
      order: {
        include: {
          user:  { select: { name: true, mobile: true } },
          items: {
            where:   { productId: { in: productIds } },
            include: { product: { select: { name: true, unit: true, images: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return assignments.map((a) => ({
    id:            a.order.id,
    customer:      a.order.user.name,
    mobile:        a.order.user.mobile,
    status:        a.order.status,
    paymentMethod: a.order.paymentMethod,
    createdAt:     a.order.createdAt,
    items: a.order.items.map((i) => ({
      name:     i.product.name,
      unit:     i.product.unit,
      image:    i.product.images[0] ?? null,
      quantity: i.quantity,
      price:    i.price,
      variant:  i.variant,
      subtotal: i.price * i.quantity,
      accepted: i.accepted,
    })),
    subtotal:        a.order.items.reduce((s, i) => s + i.price * i.quantity, 0),
    myItemsAccepted: a.order.items.every((i) => i.accepted),
    assignment: {
      status:      a.status,
      expiresAt:   a.expiresAt?.toISOString()   ?? null,
      notifiedAt:  a.notifiedAt?.toISOString()  ?? null,
    },
  }));
}
