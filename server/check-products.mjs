import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const rows = await p.product.findMany({ select: { id: true, name: true, images: true } });
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
