import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";
import { ok, serverError } from "../utils/response";
import { logger } from "../utils/logger";

export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await getUserNotifications(req.userId!);
    return ok(res, notifications);
  } catch (err) {
    logger.error("listNotifications", err);
    return serverError(res);
  }
}

export async function readNotification(req: AuthRequest, res: Response) {
  try {
    await markNotificationRead(req.params.id, req.userId!);
    return ok(res, null, "Marked as read");
  } catch (err) {
    logger.error("readNotification", err);
    return serverError(res);
  }
}

export async function readAllNotifications(req: AuthRequest, res: Response) {
  try {
    await markAllNotificationsRead(req.userId!);
    return ok(res, null, "All notifications marked as read");
  } catch (err) {
    logger.error("readAllNotifications", err);
    return serverError(res);
  }
}
