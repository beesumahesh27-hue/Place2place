import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { upload } from "../config/upload";
import {
  listMyProducts, getMyProduct,
  addProduct, editProduct, removeProduct,
  myStats, myOrders, myNotifications, acceptOrder, declineOrder,
  myInventory, myEarnings, shipOrder,
} from "../controllers/producer.controller";

const router = Router();

// All producer routes require authentication + PRODUCER or DC role
router.use(authenticate);
router.use(requireRole(UserRole.PRODUCER, UserRole.DC));

const mediaUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 2 },
]);

router.get("/stats",                  myStats);
router.get("/orders",                 myOrders);
router.patch("/orders/:id/accept",    acceptOrder);
router.patch("/orders/:id/decline",   declineOrder);
router.patch("/orders/:id/advance",   shipOrder);
router.get("/notifications",          myNotifications);
router.get("/inventory",              myInventory);
router.get("/earnings",               myEarnings);
router.get("/products",    listMyProducts);
router.get("/products/:id", getMyProduct);
router.post("/products",   mediaUpload, addProduct);
router.put("/products/:id", mediaUpload, editProduct);
router.delete("/products/:id", removeProduct);

export default router;
