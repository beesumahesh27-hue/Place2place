/**
 * Generates a 50-second "Field to Customer" story video for the Rice product.
 * 5 scenes × 10 seconds each, concatenated into one MP4.
 */
const ffmpegPath = require("ffmpeg-static");
const { execSync }  = require("child_process");
const { PrismaClient } = require("@prisma/client");
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma    = new PrismaClient();
const VIDEOS_DIR = path.join(process.cwd(), "uploads", "videos");

// Windows system font (bold Arial)
const FONT = "C:/Windows/Fonts/arialbd.ttf";

// 5 story stages, each 10 seconds
const SCENES = [
  {
    color:    "0x1B5E20",   // deep forest green  – paddyfield
    title:    "Stage 1: Field Preparation",
    subtitle: "Farmers flood and plough paddy fields",
    label:    "PADDY FIELD",
  },
  {
    color:    "0x33691E",   // lime-green – growing crop
    title:    "Stage 2: Sowing & Growing",
    subtitle: "Seeds sown, rice grows for 120 days",
    label:    "GROWING",
  },
  {
    color:    "0xF9A825",   // golden amber – harvest
    title:    "Stage 3: Harvesting",
    subtitle: "Golden rice stalks cut and threshed",
    label:    "HARVESTING",
  },
  {
    color:    "0x6D4C41",   // warm brown – mill
    title:    "Stage 4: Milling & Processing",
    subtitle: "Husked, cleaned and quality-checked",
    label:    "MILLING",
  },
  {
    color:    "0x1c3a2a",   // brand dark green – delivery
    title:    "Stage 5: Delivered to You",
    subtitle: "Fresh rice packed and shipped to your door",
    label:    "DELIVERY",
  },
];

const DURATION   = 10;           // seconds per scene
const W          = 1280;
const H          = 720;
const FPS        = 24;

// Build the FFmpeg drawtext filter string for one scene
function drawtextFilters(scene, sceneIndex) {
  const fontFile = `fontfile='${FONT}'`;

  // Stage label – top-left chip
  const chip = [
    `drawtext=${fontFile}`,
    `text='${scene.label}'`,
    `fontsize=22`,
    `fontcolor=white`,
    `x=24:y=24`,
    `box=1:boxcolor=black@0.55:boxborderw=8`,
  ].join(":");

  // Big title – centre
  const title = [
    `drawtext=${fontFile}`,
    `text='${scene.title}'`,
    `fontsize=52`,
    `fontcolor=white`,
    `x=(w-text_w)/2:y=(h-text_h)/2-40`,
    `box=1:boxcolor=black@0.45:boxborderw=14`,
  ].join(":");

  // Sub-title – just below title
  const sub = [
    `drawtext=${fontFile}`,
    `text='${scene.subtitle}'`,
    `fontsize=30`,
    `fontcolor=yellow`,
    `x=(w-text_w)/2:y=(h+text_h)/2+20`,
    `box=1:boxcolor=black@0.40:boxborderw=10`,
  ].join(":");

  // Progress dots – bottom centre
  const dots = SCENES.map((_, i) => {
    const colour = i === sceneIndex ? "white" : "white@0.30";
    const cx     = Math.round(W / 2 + (i - 2) * 28);
    return `drawbox=x=${cx - 6}:y=${H - 30}:w=12:h=12:color=${colour}:t=fill`;
  }).join(",");

  return [chip, title, sub, dots].join(",");
}

function generateScene(scene, index, outFile) {
  const filters = drawtextFilters(scene, index);
  const color   = scene.color.startsWith("0x") ? scene.color.slice(2) : scene.color;

  const cmd = [
    `"${ffmpegPath}" -y`,
    `-t ${DURATION}`,
    `-f lavfi -i "color=c=0x${color}:size=${W}x${H}:rate=${FPS}"`,
    `-f lavfi -i "anullsrc=r=44100:cl=stereo"`,
    `-vf "${filters}"`,
    `-t ${DURATION}`,
    `-c:v libx264 -preset ultrafast -crf 26 -pix_fmt yuv420p`,
    `-c:a aac -b:a 64k -shortest`,
    `"${outFile.replace(/\\/g, "/")}"`,
  ].join(" ");

  execSync(cmd, { stdio: "pipe" });
}

async function main() {
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  // Find both "Rice" and "Sona Masoori Rice" products
  const riceProducts = await prisma.product.findMany({
    where: { name: { contains: "rice", mode: "insensitive" } },
    select: { id: true, name: true, videos: true },
  });

  if (riceProducts.length === 0) {
    console.error("No rice product found in database.");
    process.exit(1);
  }

  // ── Step 1: Generate the 5 scene clips ─────────────────────────────────────
  console.log("Generating 5 scene clips…");
  const sceneFiles = [];

  for (let i = 0; i < SCENES.length; i++) {
    const tmpFile = path.join(VIDEOS_DIR, `_scene_${i}.mp4`);
    sceneFiles.push(tmpFile);
    process.stdout.write(`  [${i + 1}/5] ${SCENES[i].label} … `);
    generateScene(SCENES[i], i, tmpFile);
    process.stdout.write("done\n");
  }

  // ── Step 2: Concatenate ────────────────────────────────────────────────────
  console.log("Concatenating into 50-second video…");
  const concatList = path.join(VIDEOS_DIR, "_concat.txt");
  fs.writeFileSync(concatList, sceneFiles.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n"));

  const masterFile = path.join(VIDEOS_DIR, "_rice_master.mp4");
  execSync(
    `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatList.replace(/\\/g, "/")}" -c copy "${masterFile.replace(/\\/g, "/")}"`,
    { stdio: "pipe" }
  );

  // ── Step 3: Assign to every rice product in the DB ─────────────────────────
  for (const rp of riceProducts) {
    // Remove previous video files
    for (const v of rp.videos) {
      const old = path.join(process.cwd(), v.startsWith("/") ? v.slice(1) : v);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    const filename   = `${crypto.randomUUID()}.mp4`;
    const destFile   = path.join(VIDEOS_DIR, filename);
    fs.copyFileSync(masterFile, destFile);

    await prisma.product.update({
      where: { id: rp.id },
      data:  { videos: [`/uploads/videos/${filename}`] },
    });

    console.log(`  ✓ ${rp.name} → /uploads/videos/${filename} (${(fs.statSync(destFile).size / 1024).toFixed(0)} KB)`);
  }

  // ── Cleanup temporaries ────────────────────────────────────────────────────
  for (const f of [...sceneFiles, concatList, masterFile]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  console.log("\nDone — rice cultivation video attached to all rice products.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
