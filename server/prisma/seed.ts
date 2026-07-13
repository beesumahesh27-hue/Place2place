/// <reference types="node" />
import { PrismaClient, ProductStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const categoryData = [
  { slug: "all", label: "All products", icon: "🌿" },
  { slug: "dairy", label: "Ghee & Dairy", icon: "🥛" },
  { slug: "fruits", label: "Fruits", icon: "🍋" },
  { slug: "oils", label: "Organic Cooking Oils", icon: "🫙" },
  { slug: "honey", label: "Honey & Natural Sweeteners", icon: "🍯" },
  { slug: "dryfuits", label: "Dry Fruits & Nuts", icon: "🥜" },
  { slug: "spices", label: "Spices & Powders", icon: "🌶️" },
  { slug: "rice", label: "Rice Varieties", icon: "🌾" },
  { slug: "snacks", label: "Snacks & Sweets", icon: "🍬" },
  { slug: "eggs", label: "Eggs & Poultry", icon: "🥚" },
];

const producerData = [
  { name: "Nandini Dairy Farm", mobile: "9000000001", businessName: "Nandini Dairy Farm", businessLocation: "Karimnagar, Telangana" },
  { name: "Konkan Dry Fruits", mobile: "9000000002", businessName: "Konkan Dry Fruits", businessLocation: "Hyderabad, Telangana" },
  { name: "Sunder Bee Farm", mobile: "9000000003", businessName: "Sunder Bee Farm", businessLocation: "Adilabad, Telangana" },
  { name: "Green Valley Egg Farm", mobile: "9000000004", businessName: "Green Valley Egg Farm", businessLocation: "Rangareddy, Telangana" },
  { name: "Ratnagiri Farms", mobile: "9000000005", businessName: "Ratnagiri Farms", businessLocation: "Nalgonda, Telangana" },
  { name: "Kisan Oil Mill", mobile: "9000000006", businessName: "Kisan Oil Mill", businessLocation: "Warangal, Telangana" },
  { name: "Nellore Spice Mill", mobile: "9000000007", businessName: "Nellore Spice Mill", businessLocation: "Nizamabad, Telangana" },
  { name: "Krishna Rice Mill", mobile: "9000000008", businessName: "Krishna Rice Mill", businessLocation: "Khammam, Telangana" },
  { name: "Telangana Snack Hub", mobile: "9000000009", businessName: "Telangana Snack Hub", businessLocation: "Hyderabad, Telangana" },
];

const productData = [
  { name: "A2 Desi Cow Ghee", description: "Pure A2 ghee made from desi cow milk using traditional Bilona method.", price: 1299, unit: "ml", variants: ["500ml", "1000ml", "250ml"], images: ["/products/ghee.jpg"], videos: [], categorySlug: "dairy", producerMobile: "9000000001", quantity: 150, status: ProductStatus.AVAILABLE, deliveryTime: "2-3 hours", organic: true },
  { name: "Cashews", description: "Premium quality cashews sourced directly from farms. No additives, no preservatives.", price: 899, unit: "g", variants: ["500g", "250g", "1kg"], images: ["/products/cashews.jpg"], videos: [], categorySlug: "dryfuits", producerMobile: "9000000002", quantity: 80, status: ProductStatus.AVAILABLE, deliveryTime: "2-4 hours", organic: false },
  { name: "Natural Honey", description: "Raw, unprocessed honey directly from forest beehives. 100% pure.", price: 349, unit: "g", variants: ["500g", "1000g"], images: ["/products/honey.jpg"], videos: [], categorySlug: "honey", producerMobile: "9000000003", quantity: 45, status: ProductStatus.LOW_STOCK, deliveryTime: "3-5 hours", organic: true },
  { name: "Organic Eggs", description: "Free-range organic eggs from country hens. Rich in protein, 100% antibiotic-free.", price: 249, unit: "Tray", variants: ["Box of 12", "Box of 6"], images: ["/products/eggs.jpg"], videos: [], categorySlug: "eggs", producerMobile: "9000000004", quantity: 200, status: ProductStatus.AVAILABLE, deliveryTime: "1-2 hours", organic: true },
  { name: "Organic Mangoes", description: "Chemical-free, pure organic mangoes grown without pesticides.", price: 399, unit: "kg", variants: ["1kg", "2kg", "5kg"], images: ["/products/mangoes.jpg"], videos: [], categorySlug: "fruits", producerMobile: "9000000005", quantity: 0, status: ProductStatus.OUT_OF_STOCK, deliveryTime: "Same day", organic: true },
  { name: "Cold Press Groundnut Oil", description: "Traditional wood-pressed groundnut oil. No chemicals, no refining.", price: 549, unit: "L", variants: ["1L", "2L", "500ml"], images: ["/products/groundnut-oil.jpg"], videos: [], categorySlug: "oils", producerMobile: "9000000006", quantity: 120, status: ProductStatus.AVAILABLE, deliveryTime: "2-3 hours", organic: true },
  { name: "Pure Turmeric Powder", description: "Stone-ground turmeric from our own farms. High curcumin content.", price: 199, unit: "Kg", variants: ["100g", "250g", "500g"], images: ["/products/turmeric.jpg"], videos: [], categorySlug: "spices", producerMobile: "9000000007", quantity: 10, status: ProductStatus.LOW_STOCK, deliveryTime: "3-4 hours", organic: true },
  { name: "Sona Masoori Rice", description: "Premium Sona Masoori rice directly from Andhra paddy fields.", price: 699, unit: "kg", variants: ["5kg", "10kg", "25kg"], images: ["/products/rice.jpg"], videos: [], categorySlug: "rice", producerMobile: "9000000008", quantity: 0, status: ProductStatus.UPDATING, deliveryTime: "4-6 hours", organic: false },
  { name: "Traditional Snacks Mix", description: "Crispy homestyle snacks — murukku, chakli, ribbon pakoda and boondi mix.", price: 249, unit: "Kg", variants: ["250g", "500g", "1kg"], images: ["/products/snacks.jpg"], videos: [], categorySlug: "snacks", producerMobile: "9000000009", quantity: 90, status: ProductStatus.AVAILABLE, deliveryTime: "2-4 hours", organic: false },
];

async function main() {
  console.log("Seeding database...");

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    categories[cat.slug] = c.id;
  }
  console.log(`  ✓ ${categoryData.length} categories`);

  const producers: Record<string, string> = {};
  for (const p of producerData) {
    const u = await prisma.user.upsert({
      where: { mobile: p.mobile },
      update: { businessName: p.businessName, businessLocation: p.businessLocation },
      create: { name: p.name, mobile: p.mobile, role: UserRole.PRODUCER, businessName: p.businessName, businessLocation: p.businessLocation },
    });
    producers[p.mobile] = u.id;
  }
  console.log(`  ✓ ${producerData.length} producers`);

  for (const { categorySlug, producerMobile, ...rest } of productData) {
    await prisma.product.create({
      data: { ...rest, categoryId: categories[categorySlug], producerId: producers[producerMobile] },
    });
  }
  console.log(`  ✓ ${productData.length} products`);

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
