import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { unauthorized } from "../utils/response";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return unauthorized(res, "No token provided");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    unauthorized(res, "Invalid or expired token");
  }
}
