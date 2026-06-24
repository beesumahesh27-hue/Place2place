import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  listNotifications,
  readNotification,
  readAllNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/",              listNotifications);
router.patch("/read-all",    readAllNotifications);
router.patch("/:id/read",    readNotification);

export default router;
