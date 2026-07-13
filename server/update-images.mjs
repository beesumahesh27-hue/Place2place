import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// Update all Sona Masoori Rice products
const riceUpdate = await p.product.updateMany({
  where: { name: { contains: "Sona Ma" } },
  data: { images: ["/products/rice.svg"] },
});
console.log(`Updated ${riceUpdate.count} Sona Masoori Rice product(s) → /products/rice.svg`);

// Update milk product(s) — match "milk" case-insensitive
const milkProducts = await p.product.findMany({
  where: { name: { contains: "Milk", mode: "insensitive" } },
  select: { id: true, name: true },
});
for (const m of milkProducts) {
  await p.product.update({
    where: { id: m.id },
    data: { images: ["/products/milk.svg"] },
  });
  console.log(`Updated "${m.name}" (${m.id}) → /products/milk.svg`);
}

await p.$disconnect();
console.log("Done.");
