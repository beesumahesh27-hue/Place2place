import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import routes from "./routes";
import { restorePendingTimeouts } from "./services/assignment.service";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60_000, max: 200, standardHeaders: true, legacyHeaders: false }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", env: env.NODE_ENV }));

// ── Static uploads (producer photos & videos) ────────────────────────────────
// Override Helmet's same-origin CORP so the frontend (different port) can load media
app.use("/uploads", (_req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  restorePendingTimeouts().catch((err) => logger.error("restorePendingTimeouts", err));
});

export default app;
