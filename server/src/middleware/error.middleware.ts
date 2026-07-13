import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err.message, err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}
