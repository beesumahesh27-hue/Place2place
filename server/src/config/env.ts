import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT ?? "4000"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  get isDev() { return this.NODE_ENV !== "production"; },
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(","),
  JWT_SECRET: process.env.JWT_SECRET ?? "change-this-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES ?? "5"),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
};
