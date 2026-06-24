import { Router } from "express";
import { listProducts, getProduct, listCategories } from "../controllers/product.controller";

const router = Router();

router.get("/categories", listCategories);
router.get("/", listProducts);
router.get("/:id", getProduct);

export default router;
