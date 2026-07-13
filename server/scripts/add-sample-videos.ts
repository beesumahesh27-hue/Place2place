import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const source = path.join(process.cwd(), "uploads", "videos", "sample_source.mp4");
  if (!fs.existsSync(source)) {
    console.error("sample_source.mp4 not found in uploads/videos/");
    process.exit(1);
  }

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  console.log(`Updating ${products.length} products…`);

  for (const product of products) {
    const filename = `${crypto.randomUUID()}.mp4`;
    const dest = path.join(process.cwd(), "uploads", "videos", filename);
    fs.copyFileSync(source, dest);

    await prisma.product.update({
      where: { id: product.id },
      data: { videos: [`/uploads/videos/${filename}`] },
    });

    console.log(`  ✓ ${product.name}  →  /uploads/videos/${filename}`);
  }

  // Remove the temporary source file
  fs.unlinkSync(source);
  console.log("\nDone. sample_source.mp4 cleaned up.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
