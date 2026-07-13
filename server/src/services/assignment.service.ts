import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { createNotification } from "./notification.service";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// In-memory timeout store — resets on server restart (acceptable for setTimeout approach)
const activeTimeouts = new Map<string, NodeJS.Timeout>();

function timeoutKey(orderId: string, producerId: string) {
  return `${orderId}:${producerId}`;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scheduleTimeout(orderId: string, producerId: string, delayMs: number): void {
  const key = timeoutKey(orderId, producerId);
  const existing = activeTimeouts.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    activeTimeouts.delete(key);
    await escalateOrder(orderId, producerId);
  }, delayMs);

  activeTimeouts.set(key, timer);
}

export function cancelTimeout(orderId: string, producerId: string): void {
  const key = timeoutKey(orderId, producerId);
  const existing = activeTimeouts.get(key);
  if (existing) {
    clearTimeout(existing);
    activeTimeouts.delete(key);
  }
}

async function escalateOrder(orderId: string, expiredProducerId: string): Promise<void> {
  await prisma.orderAssignment.updateMany({
    where: { orderId, producerId: expiredProducerId, status: "PENDING" },
    data: { status: "EXPIRED", respondedAt: new Date() },
  });

  const next = await prisma.orderAssignment.findFirst({
    where: { orderId, status: "WAITING" },
    orderBy: { rank: "asc" },
  });

  if (!next) {
    logger.warn(`Order ${orderId}: all producers timed out or declined — needs admin review`);
    return;
  }

  const now = new Date();
  await prisma.orderAssignment.update({
    where: { id: next.id },
    data: {
      status: "PENDING",
      notifiedAt: now,
      expiresAt: new Date(now.getTime() + TIMEOUT_MS),
    },
  });

  createNotification(
    next.producerId,
    "order_placed",
    "New Order Request",
    `You have a new order to fulfill. Accept within 5 minutes.`,
    orderId
  ).catch((e) => logger.error("createNotification (escalate)", e));

  scheduleTimeout(orderId, next.producerId, TIMEOUT_MS);
  logger.info(`Order ${orderId}: routed to producer ${next.producerId} (rank ${next.rank})`);
}

export async function startOrderRouting(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { include: { producer: true } } } },
      user: true,
      address: true,
    },
  });
  if (!order) return;

  // Customer location: delivery address preferred, then user profile
  const customerLat = order.address?.latitude ?? order.user.latitude;
  const customerLon = order.address?.longitude ?? order.user.longitude;

  // Collect unique producers from order items
  const producerMap = new Map<string, { lat: number | null; lon: number | null }>();
  for (const item of order.items) {
    const p = item.product.producer;
    if (!producerMap.has(p.id)) {
      producerMap.set(p.id, { lat: p.latitude ?? null, lon: p.longitude ?? null });
    }
  }

  // Sort by distance (producers without coords go last)
  const ranked = Array.from(producerMap.entries())
    .map(([producerId, coords]) => ({
      producerId,
      distance:
        customerLat && customerLon && coords.lat && coords.lon
          ? distanceKm(customerLat, customerLon, coords.lat, coords.lon)
          : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);

  if (ranked.length === 0) return;

  const now = new Date();

  for (let i = 0; i < ranked.length; i++) {
    const isFirst = i === 0;
    await prisma.orderAssignment.create({
      data: {
        orderId,
        producerId: ranked[i].producerId,
        rank: i + 1,
        status: isFirst ? "PENDING" : "WAITING",
        notifiedAt: isFirst ? now : null,
        expiresAt: isFirst ? new Date(now.getTime() + TIMEOUT_MS) : null,
      },
    });
  }

  createNotification(
    ranked[0].producerId,
    "order_placed",
    "New Order Request",
    `You have a new order to fulfill. Accept within 5 minutes.`,
    orderId
  ).catch((e) => logger.error("createNotification (startRouting)", e));

  scheduleTimeout(orderId, ranked[0].producerId, TIMEOUT_MS);
  logger.info(`Order ${orderId}: routing started, first producer ${ranked[0].producerId}`);
}

export async function acceptAssignment(orderId: string, producerId: string): Promise<boolean> {
  const assignment = await prisma.orderAssignment.findFirst({
    where: { orderId, producerId, status: "PENDING" },
  });
  if (!assignment) return false;

  cancelTimeout(orderId, producerId);

  await prisma.orderAssignment.update({
    where: { id: assignment.id },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  return true;
}

export async function declineAssignment(orderId: string, producerId: string): Promise<boolean> {
  const assignment = await prisma.orderAssignment.findFirst({
    where: { orderId, producerId, status: "PENDING" },
  });
  if (!assignment) return false;

  cancelTimeout(orderId, producerId);

  await prisma.orderAssignment.update({
    where: { id: assignment.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  await escalateOrder(orderId, producerId);
  return true;
}

// Call on server startup to re-arm timeouts that survived a restart
export async function restorePendingTimeouts(): Promise<void> {
  const pending = await prisma.orderAssignment.findMany({
    where: { status: "PENDING" },
  });

  const now = new Date();
  for (const a of pending) {
    if (!a.expiresAt) continue;
    const remaining = a.expiresAt.getTime() - now.getTime();
    if (remaining <= 0) {
      await escalateOrder(a.orderId, a.producerId);
    } else {
      scheduleTimeout(a.orderId, a.producerId, remaining);
    }
  }

  if (pending.length > 0) {
    logger.info(`Restored ${pending.length} pending order assignment timeout(s)`);
  }
}
