import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { prisma } from "./config/database";
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

app.get("/health/db", async (_req, res) => {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const databaseUrlLength = process.env.DATABASE_URL?.length ?? 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ hasDatabaseUrl, databaseUrlLength, dbConnected: true });
  } catch (err) {
    res.json({ hasDatabaseUrl, databaseUrlLength, dbConnected: false, error: (err as Error).message });
  }
});

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
