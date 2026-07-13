import { Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/database";
import { forbidden, unauthorized } from "../utils/response";
import { AuthRequest } from "./auth.middleware";

export function requireRole(...roles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return unauthorized(res);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return unauthorized(res);
    if (!roles.includes(user.role)) {
      return forbidden(res, `Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
