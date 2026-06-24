import { Router } from "express";
import { getFactoryPartners, getFarmers, getDairyFarms, getTurmericMills, getDCHubs, getPageContent } from "../controllers/services.controller";

const router = Router();

router.get("/factory",      getFactoryPartners);
router.get("/farmer",       getFarmers);
router.get("/dairy",        getDairyFarms);
router.get("/turmeric",     getTurmericMills);
router.get("/dc",           getDCHubs);
router.get("/content/:page", getPageContent);

export default router;
