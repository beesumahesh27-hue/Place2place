// Generates a 50-second dummy video for every product using the bundled ffmpeg-static binary
const ffmpegPath = require("ffmpeg-static");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();
const VIDEOS_DIR = path.join(process.cwd(), "uploads", "videos");

// Generate one 50-second SMPTE color-bar test video (looks professional, loops nicely)
function generateVideo(destPath) {
  const cmd = [
    `"${ffmpegPath}"`,
    "-y",                                           // overwrite if exists
    "-t 50",                                        // exactly 50 seconds
    `-f lavfi -i "smptehdbars=size=640x360:rate=24"`,  // SMPTE HD color bars
    "-f lavfi -i anullsrc=r=44100:cl=stereo",       // silent audio
    "-t 50",
    "-c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p",
    "-c:a aac -b:a 64k",
    "-shortest",
    `"${destPath}"`,
  ].join(" ");

  execSync(cmd, { stdio: "ignore" });
}

async function main() {
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  console.log(`Generating 50-second videos for ${products.length} products…`);

  // Remove old sample videos attached to products before re-assigning
  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { id: product.id }, select: { videos: true } });
    for (const v of existing?.videos ?? []) {
      const old = path.join(process.cwd(), v);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    const filename = `${crypto.randomUUID()}.mp4`;
    const destPath = path.join(VIDEOS_DIR, filename);

    process.stdout.write(`  Generating: ${product.name} … `);
    generateVideo(destPath);
    process.stdout.write(`done (${(fs.statSync(destPath).size / 1024).toFixed(0)} KB)\n`);

    await prisma.product.update({
      where: { id: product.id },
      data: { videos: [`/uploads/videos/${filename}`] },
    });
  }

  console.log("\nAll products updated with 50-second videos.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
