import { Request, Response } from "express";
import { createAndSendOtp, verifyOtp } from "../services/otp.service";
import { findOrCreateUser, getUserById, updateUserProfile, upsertProducerProfile, upsertFarmerProfile, upsertDCProfile, signToken } from "../services/auth.service";
import { ok, badRequest, serverError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { prisma } from "../config/database";

export async function sendOtp(req: Request, res: Response) {
  try {
    const { contact, type, mobile } = req.body as { contact?: string; mobile?: string; type?: "phone" | "email" };
    const target = contact ?? mobile ?? "";
    if (!target) return badRequest(res, "Mobile or contact is required");
    const result = await createAndSendOtp(target, type ?? "phone");
    return ok(res, result.devOtp ? { devOtp: result.devOtp } : undefined, "OTP sent");
  } catch (err) {
    logger.error("sendOtp", err);
    return serverError(res, (err as Error).message);
  }
}

export async function verifyOtpAndLogin(req: Request, res: Response) {
  try {
    const { contact, mobile, otp } = req.body as { contact?: string; mobile?: string; otp: string };
    const target = contact ?? mobile ?? "";
    if (!target) return badRequest(res, "Mobile or contact is required");

    const valid = await verifyOtp(target, otp);
    if (!valid) return badRequest(res, "Invalid or expired OTP");

    // Check if user already exists with a real name (not just the mobile number)
    const existing = await prisma.user.findFirst({ where: { mobile: target } });
    const hasRealName = existing && existing.name && existing.name !== target;

    if (hasRealName) {
      // Existing user → log in directly
      const token = signToken(existing!.id);
      return ok(res, { token, user: existing, isNewUser: false }, "Login successful");
    }

    // New user — create a placeholder, return a real token so the client can call PATCH /profile immediately
    const placeholderUser = await findOrCreateUser({ name: target, mobile: target });
    const token = signToken(placeholderUser.id);
    return ok(res, { token, user: placeholderUser, isNewUser: true }, "OTP verified — please complete your profile");
  } catch (err) {
    logger.error("verifyOtpAndLogin", err);
    return serverError(res);
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const {
      name, role, businessName, businessLocation, email,
      latitude, longitude,
      producerSubType,
      factoryType, productsMade, skuCount, established, description,
      cattleBreed, cowsCount, fssaiCertified,
      grindingMethod, curcuminContent, millCapacity,
      crops, acres, organic, farmSince, village,
      coverageAreas, operatingHours, riderCount, capacity, coldStorage,
    } = req.body as {
      name?: string;
      role?: "CUSTOMER" | "PRODUCER" | "DC";
      businessName?: string;
      businessLocation?: string;
      email?: string;
      latitude?: number;
      longitude?: number;
      producerSubType?: "factory" | "farmer";
      factoryType?: string;
      productsMade?: string;
      skuCount?: number;
      established?: number;
      description?: string;
      cattleBreed?: string;
      cowsCount?: number;
      fssaiCertified?: boolean;
      grindingMethod?: string;
      curcuminContent?: string;
      millCapacity?: string;
      crops?: string;
      acres?: number;
      organic?: boolean;
      farmSince?: number;
      village?: string;
      coverageAreas?: string;
      operatingHours?: string;
      riderCount?: number;
      capacity?: string;
      coldStorage?: string;
    };

    if (!name?.trim()) return badRequest(res, "Name is required");

    const user = await updateUserProfile(req.userId!, { name, role, businessName, businessLocation, email, latitude, longitude });

    if (role === "PRODUCER") {
      if (producerSubType === "farmer" && crops && farmSince) {
        await upsertFarmerProfile(user.id, {
          crops,
          acres: acres ?? 0,
          organic: organic ?? false,
          farmSince,
          village,
        });
      } else if (factoryType && productsMade && established) {
        await upsertProducerProfile(user.id, {
          factoryType,
          productsMade,
          skuCount: skuCount ?? 0,
          established,
          description,
          ...(factoryType === "Dairy" ? { cattleBreed, cowsCount, fssaiCertified } : {}),
          ...(factoryType === "Spice Mill" ? { grindingMethod, curcuminContent, millCapacity } : {}),
        });
      }
    }

    if (role === "DC" && coverageAreas && operatingHours) {
      await upsertDCProfile(user.id, {
        coverageAreas,
        operatingHours,
        riderCount: riderCount ?? 0,
        capacity: capacity ?? "0/day",
        coldStorage,
      });
    }

    const token = signToken(user.id);
    return ok(res, { token, user }, "Profile updated");
  } catch (err) {
    logger.error("updateProfile", err);
    return serverError(res);
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await getUserById(req.userId!);
    if (!user) return badRequest(res, "User not found");
    return ok(res, user);
  } catch (err) {
    logger.error("getMe", err);
    return serverError(res);
  }
}
