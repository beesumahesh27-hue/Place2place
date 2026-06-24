import { Router } from "express";
import { createBookingHandler, getBookingsHandler } from "../controllers/booking.controller";

const router = Router();

router.post("/", createBookingHandler);
router.get("/", getBookingsHandler);

export default router;
