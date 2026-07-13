import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { Request } from "express";

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    const isVideo = file.mimetype.startsWith("video/");
    cb(null, path.join(process.cwd(), "uploads", isVideo ? "videos" : "images"));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images (jpg/png/webp) and videos (mp4/mov/webm) are allowed"));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});
