import { Router } from "express";
import { z } from "zod";
import { sendOtp, verifyOtpAndLogin, updateProfile, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

const sendOtpSchema = z.object({
  contact: z.string().optional(),
  mobile: z.string().optional(),
  type: z.enum(["phone", "email"]).optional(),
});

const verifyOtpSchema = z.object({
  contact: z.string().optional(),
  mobile: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const updateProfileSchema = z.object({
  name:             z.string().min(2, "Name must be at least 2 characters"),
  role:             z.enum(["CUSTOMER", "PRODUCER", "DC"]).optional(),
  businessName:     z.string().optional(),
  businessLocation: z.string().optional(),
  email:            z.string().email().optional().or(z.literal("")),
  latitude:         z.number().optional(),
  longitude:        z.number().optional(),
  // Producer sub-type
  producerSubType:  z.enum(["factory", "farmer"]).optional(),
  // Factory / industry fields
  factoryType:      z.string().optional(),
  productsMade:     z.string().optional(),
  skuCount:         z.number().int().optional(),
  established:      z.number().int().optional(),
  description:      z.string().optional(),
  // Dairy-specific fields
  cattleBreed:      z.string().optional(),
  cowsCount:        z.number().int().optional(),
  fssaiCertified:   z.boolean().optional(),
  // Spice mill fields
  grindingMethod:   z.string().optional(),
  curcuminContent:  z.string().optional(),
  millCapacity:     z.string().optional(),
  // Farmer fields
  crops:            z.string().optional(),
  acres:            z.number().optional(),
  organic:          z.boolean().optional(),
  farmSince:        z.number().int().optional(),
  village:          z.string().optional(),
  // DC fields
  coverageAreas:    z.string().optional(),
  operatingHours:   z.string().optional(),
  riderCount:       z.number().int().optional(),
  capacity:         z.string().optional(),
  coldStorage:      z.string().optional(),
});

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtpAndLogin);
router.patch("/profile", authenticate, validate(updateProfileSchema), updateProfile);
router.get("/me", authenticate, getMe);

export default router;
