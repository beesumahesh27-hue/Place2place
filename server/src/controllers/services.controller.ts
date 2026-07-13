import { Request, Response } from "express";
import { listFactoryPartners, listFarmers, listDairyFarms, listTurmericMills, listDCHubs } from "../services/services.service";
import { ok, notFound, serverError } from "../utils/response";
import { logger } from "../utils/logger";

// ── Editorial / marketing content served from server ─────────────────────────
const PAGE_CONTENT: Record<string, unknown> = {
  homepage: {
    trustFeatures: [
      { icon: "ShieldCheck", title: "Pure & Tested",  desc: "No artificial colours, no preservatives — just clean, honest food as nature intended." },
      { icon: "RefreshCw",   title: "Always Fresh",   desc: "Harvested every morning. What leaves the field today reaches your door today." },
      { icon: "Leaf",        title: "From the Soil",  desc: "No cold storage, no middlemen — straight from Telangana's fields to your table." },
    ],
    businessTypes: ["🏭 Rice Mill", "🥚 Egg Farm", "🌿 Turmeric", "🫙 Oil Mill", "🥛 Dairy", "🌾 Organic"],
  },
  farmer: {
    priceComparison: [
      { crop: "Turmeric",   mandi: 65,  p2p: 90  },
      { crop: "Red Chili",  mandi: 110, p2p: 145 },
      { crop: "Groundnut",  mandi: 55,  p2p: 72  },
      { crop: "Raw Rice",   mandi: 28,  p2p: 38  },
    ],
    betterPay:    "35%",
    extraEarnings: "₹18.4 Lakhs",
  },
  dairy: {
    whyA2: [
      { icon: "Leaf",        title: "Easier to Digest",   desc: "A2 protein (beta-casein A2) is gentler on the gut compared to A1 found in commercial milk. Better for lactose-sensitive individuals." },
      { icon: "Star",        title: "Nutrient Rich",       desc: "Higher Omega-3, CLA, and Vitamin D compared to standard market milk. Supports bone health and immunity." },
      { icon: "Clock",       title: "Daily Fresh Harvest", desc: "Collected every morning from desi cows. No cold-chain adulteration, no mixing of batches." },
      { icon: "ShieldCheck", title: "FSSAI Tested",        desc: "Every batch is lab-tested for adulteration, fat content, and SNF before dispatch to your colony." },
    ],
    comparison: [
      ["Protein Type",    "Beta-casein A1", "Beta-casein A2"],
      ["Digestibility",   "Moderate",       "High"],
      ["BCM-7 peptide",   "Present",        "Absent"],
      ["Omega-3 content", "Low",            "Higher"],
      ["Cow Breed",       "HF / Jersey",    "Gir / Ongole"],
      ["Preservation",    "Pasteurised",    "Fresh / Raw"],
    ],
    stats: [
      { v: null, l: "Linked Farms" },
      { v: "A2",    l: "Milk Standard"  },
      { v: "4 hrs", l: "Farm to Door"   },
      { v: "0",     l: "Preservatives"  },
      { v: "Daily", l: "Fresh Batch"    },
      { v: "FSSAI", l: "Certified"      },
    ],
  },
  factory: {
    processSteps: [
      { icon: "ShieldCheck", title: "Verified Onboarding", desc: "Each factory goes through FSSAI verification, hygiene audit, and price benchmarking before listing." },
      { icon: "Truck",       title: "Direct Dispatch",      desc: "Orders go directly to the factory. No middlemen, no cold-storage delay, no markup." },
      { icon: "Users",       title: "Community Sourcing",   desc: "Local communities benefit — factory owners earn more, customers pay less." },
      { icon: "Package",     title: "Packed to Standard",   desc: "All products are packed per BIS/FSSAI norms with batch codes and MRP labels." },
    ],
    qualityStandards: [
      { label: "FSSAI Compliance",       pct: 100 },
      { label: "Hygiene Score ≥ 85/100", pct: 92  },
      { label: "On-time Dispatch",        pct: 96  },
      { label: "Customer Satisfaction",   pct: 88  },
    ],
  },
  turmeric: {
    features: [
      { icon: "Wheat",       title: "Stone-ground Process",  desc: "Traditional grinding preserves volatile oils and active curcuminoids lost in high-speed machine milling." },
      { icon: "FlaskConical",title: "Lab-tested Curcumin",   desc: "Every batch is tested for curcumin content above 5.5% before dispatch. Certificate available on request." },
      { icon: "Award",       title: "No Artificial Colour",  desc: "Market turmeric is often dyed with metanil yellow (a carcinogen). Ours is naturally bright golden — no dye." },
      { icon: "MapPin",      title: "Single-origin",         desc: "Sourced only from Nizamabad and Nellore districts — India's top turmeric belts with highest curcumin naturally." },
      { icon: "Leaf",        title: "Pesticide-free",        desc: "Partner farms follow IPM (Integrated Pest Management). Zero synthetic pesticide residue on final product." },
      { icon: "ShieldCheck", title: "FSSAI Compliant",       desc: "All packaging meets FSSAI labelling norms with batch number, manufacturing date, and test report QR code." },
    ],
    millingSteps: [
      "Farm harvest (Nizamabad / Nellore)",
      "Sun-dried for 12 days",
      "De-skinned with wooden peeler",
      "Stone-ground at < 40°C",
      "Sieved to 200 mesh fineness",
      "Nitrogen-flushed packaging",
    ],
    curcuminComparison: [
      { label: "Place2Place (Stone-ground)", pct: 82, color: "bg-yellow-500" },
      { label: "Premium Brand (Market)",     pct: 58, color: "bg-yellow-300" },
      { label: "Generic Packet (Market)",    pct: 30, color: "bg-gray-300"   },
      { label: "Adulterated Samples (Lab)",  pct: 12, color: "bg-red-300"    },
    ],
    stats: [
      { v: null, l: "Linked Mills" },
      { v: "6%+",   l: "Curcumin" },
      { v: "0",     l: "Additives" },
      { v: "TG/AP", l: "Origin"   },
    ],
  },
  market: {
    benefits: [
      { icon: "🏘️", label: "Apartments & Colonies" },
      { icon: "📦", label: "50+ Products On-site"  },
      { icon: "🆓", label: "Zero Setup Cost"        },
      { icon: "📅", label: "Flexible Scheduling"    },
      { icon: "🧾", label: "Invoice Provided"       },
      { icon: "⭐", label: "Resident Feedback"      },
    ],
    timeSlots: ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"],
  },
};

export async function getFactoryPartners(req: Request, res: Response) {
  try {
    const partners = await listFactoryPartners();
    return ok(res, partners);
  } catch (err) {
    logger.error("getFactoryPartners", err);
    return serverError(res);
  }
}

export async function getFarmers(req: Request, res: Response) {
  try {
    const farmers = await listFarmers();
    return ok(res, farmers);
  } catch (err) {
    logger.error("getFarmers", err);
    return serverError(res);
  }
}

export async function getDairyFarms(req: Request, res: Response) {
  try {
    const farms = await listDairyFarms();
    return ok(res, farms);
  } catch (err) {
    logger.error("getDairyFarms", err);
    return serverError(res);
  }
}

export async function getTurmericMills(req: Request, res: Response) {
  try {
    const mills = await listTurmericMills();
    return ok(res, mills);
  } catch (err) {
    logger.error("getTurmericMills", err);
    return serverError(res);
  }
}

export async function getDCHubs(_req: Request, res: Response) {
  try {
    const hubs = await listDCHubs();
    return ok(res, hubs);
  } catch (err) {
    logger.error("getDCHubs", err);
    return serverError(res);
  }
}

export function getPageContent(req: Request, res: Response) {
  const { page } = req.params;
  const content = PAGE_CONTENT[page];
  if (!content) return notFound(res, `No content found for page "${page}"`);
  return ok(res, content);
}
