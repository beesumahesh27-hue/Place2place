import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { env } from "../config/env";

export async function findOrCreateUser(data: {
  name: string;
  mobile: string;
  email?: string;
  role?: "CUSTOMER" | "PRODUCER" | "DC";
  businessName?: string;
  businessLocation?: string;
}) {
  const { role, businessName, businessLocation, ...base } = data;
  return prisma.user.upsert({
    where: { mobile: data.mobile },
    update: {
      name: base.name,
      ...(base.email ? { email: base.email } : {}),
      ...(businessName ? { businessName } : {}),
      ...(businessLocation ? { businessLocation } : {}),
    },
    create: {
      ...base,
      role: (role as any) ?? "CUSTOMER",
      businessName,
      businessLocation,
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  role?: "CUSTOMER" | "PRODUCER" | "DC";
  businessName?: string;
  businessLocation?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.role ? { role: data.role as any } : {}),
      ...(data.businessName !== undefined ? { businessName: data.businessName } : {}),
      ...(data.businessLocation !== undefined ? { businessLocation: data.businessLocation } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.latitude  !== undefined ? { latitude:  data.latitude  } : {}),
      ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
    },
  });
}

export async function upsertProducerProfile(userId: string, data: {
  factoryType: string;
  productsMade: string;
  skuCount: number;
  established: number;
  description?: string;
  cattleBreed?: string;
  cowsCount?: number;
  fssaiCertified?: boolean;
  grindingMethod?: string;
  curcuminContent?: string;
  millCapacity?: string;
}) {
  return prisma.producerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function upsertFarmerProfile(userId: string, data: {
  crops: string;
  acres: number;
  organic: boolean;
  farmSince: number;
  village?: string;
}) {
  return prisma.farmerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function upsertDCProfile(userId: string, data: {
  coverageAreas: string;
  operatingHours: string;
  riderCount: number;
  capacity: string;
  coldStorage?: string;
}) {
  return prisma.dCProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as never });
}
