import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { profileHandler, deliveriesHandler, statsHandler, factoriesHandler, acceptDeliveryHandler, completeDeliveryHandler } from "../controllers/dc.controller";

const router = Router();

router.use(authenticate);

router.get("/profile",    profileHandler);
router.get("/deliveries", deliveriesHandler);
router.get("/stats",      statsHandler);
router.get("/factories",  factoriesHandler);
router.patch("/deliveries/:id/accept",  acceptDeliveryHandler);
router.patch("/deliveries/:id/deliver", completeDeliveryHandler);

export default router;
