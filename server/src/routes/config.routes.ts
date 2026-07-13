import { Router, Request, Response } from "express";
import { ok } from "../utils/response";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return ok(res, {
    deliveryFee: 49,
    states: [
      "Telangana",
      "Andhra Pradesh",
      "Karnataka",
      "Maharashtra",
      "Tamil Nadu",
      "Odisha",
      "Chhattisgarh",
      "Kerala",
    ],
  });
});

export default router;
