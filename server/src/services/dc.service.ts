import { prisma } from "../config/database";

export async function getDCProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      businessName: true,
      businessLocation: true,
      dcProfile: {
        select: { coverageAreas: true, operatingHours: true, riderCount: true },
      },
    },
  });
  if (!user) return null;
  return {
    hubName: user.businessName ?? user.name,
    location: user.businessLocation ?? "—",
    coverageAreas: user.dcProfile?.coverageAreas ?? "—",
    operatingHours: user.dcProfile?.operatingHours ?? "—",
    riderCount: user.dcProfile?.riderCount ?? 0,
  };
}

export async function getDCDeliveries() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PACKED", "OUT_FOR_DELIVERY"] } },
    include: {
      user: { select: { name: true, mobile: true } },
      address: { select: { line1: true, line2: true, city: true } },
      items: {
        include: {
          product: {
            select: {
              name: true,
              producer: { select: { name: true, businessName: true, businessLocation: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return orders.map((o) => {
    const producer = o.items[0]?.product?.producer;
    const addressStr = o.address
      ? [o.address.line1, o.address.line2, o.address.city].filter(Boolean).join(", ")
      : "No address";
    const productSummary = o.items
      .map((i) => `${i.product.name} × ${i.quantity}`)
      .join(", ");
    return {
      id: `#DEL-${o.id.slice(-6).toUpperCase()}`,
      orderId: o.id,
      customer: o.user.name,
      mobile: o.user.mobile,
      address: addressStr,
      factory: producer ? (producer.businessName ?? producer.name) : "Unknown Factory",
      factoryLocation: producer?.businessLocation ?? "",
      product: productSummary,
      total: o.total,
      status: o.status === "PACKED" ? "new" : "in_transit",
      createdAt: o.createdAt.toISOString(),
    };
  });
}

export async function getDCStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [newRequests, inTransit, deliveredToday] = await Promise.all([
    prisma.order.count({ where: { status: "PACKED" } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.order.count({
      where: { status: "DELIVERED", updatedAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  const deliveredOrders = await prisma.order.findMany({
    where: { status: "DELIVERED", updatedAt: { gte: today, lt: tomorrow } },
    select: { total: true },
  });
  const earnings = Math.round(deliveredOrders.reduce((s, o) => s + o.total * 0.1, 0));

  return { newRequests, inTransit, deliveredToday, earnings };
}

export async function getDCFactories() {
  const producers = await prisma.user.findMany({
    where: { role: "PRODUCER", producerProfile: { isNot: null } },
    select: {
      name: true,
      businessName: true,
      businessLocation: true,
      producerProfile: {
        select: { factoryType: true, skuCount: true },
      },
      products: {
        where: { status: { not: "OUT_OF_STOCK" } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return producers.map((u) => ({
    name: u.businessName ?? u.name,
    type: u.producerProfile!.factoryType,
    location: u.businessLocation ?? "—",
    items: u.producerProfile!.skuCount,
    stock:
      u.products.length === 0
        ? "Out"
        : u.products.some((p) => p.status === "LOW_STOCK")
        ? "Low"
        : u.products.some((p) => p.status === "UPDATING")
        ? "Updating"
        : "High",
  }));
}

export async function acceptDelivery(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: "OUT_FOR_DELIVERY" },
  });
}

export async function completeDelivery(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED" },
  });
}
