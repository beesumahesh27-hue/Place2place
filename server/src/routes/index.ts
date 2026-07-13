import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import producerRoutes from "./producer.routes";
import servicesRoutes from "./services.routes";
import notificationRoutes from "./notification.routes";
import bookingRoutes from "./booking.routes";
import dcRoutes from "./dc.routes";
import configRoutes from "./config.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/producer", producerRoutes);
router.use("/services", servicesRoutes);
router.use("/notifications", notificationRoutes);
router.use("/bookings", bookingRoutes);
router.use("/dc", dcRoutes);
router.use("/config", configRoutes);

export default router;
