import multer from "multer";
import { v4 as uuid } from "uuid";
import { Request } from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "./cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: isVideo ? "place2place/videos" : "place2place/images",
      resource_type: isVideo ? "video" : "image",
      public_id: uuid(),
    };
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
