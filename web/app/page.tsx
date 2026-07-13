import Link from "next/link";
import { ShieldCheck, Leaf, RefreshCw } from "lucide-react";
import FeaturedProducts from "@/components/FeaturedProducts";
import { CartProduct } from "@/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const MEDIA = "http://localhost:4000";

type Category    = { id: string; slug: string; label: string; icon: string };
type Product     = CartProduct;
type TrustItem   = { icon: string; title: string; desc: string };
type HomeContent = { trustFeatures: TrustItem[]; businessTypes: string[] };

const ICON_MAP: Record<string, React.ElementType> = { ShieldCheck, Leaf, RefreshCw };

const FALLBACK_TRUST: TrustItem[] = [
  { icon: "ShieldCheck", title: "Pure & Tested",  desc: "No artificial colours, no preservatives — just clean, honest food as nature intended." },
  { icon: "RefreshCw",   title: "Always Fresh",   desc: "Harvested every morning. What leaves the field today reaches your door today." },
  { icon: "Leaf",        title: "From the Soil",  desc: "No cold storage, no middlemen — straight from Telangana's fields to your table." },
];
const FALLBACK_BIZ = ["🏭 Rice Mill", "🥚 Egg Farm", "🌿 Turmeric", "🫙 Oil Mill", "🥛 Dairy", "🌾 Organic"];

function imgSrc(src: string) {
  return src.startsWith("/uploads") ? `${MEDIA}${src}` : src;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?limit=6`, { cache: "no-store" });
    const data = await res.json();
    return data.data?.items ?? [];
  } catch { return []; }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/products/categories`, { cache: "no-store" });
    const data = await res.json();
    return data.data ?? [];
  } catch { return []; }
}

async function getHomeContent(): Promise<HomeContent> {
  try {
    const res = await fetch(`${API}/services/content/homepage`, { cache: "no-store" });
    const data = await res.json();
    return data.data ?? { trustFeatures: FALLBACK_TRUST, businessTypes: FALLBACK_BIZ };
  } catch { return { trustFeatures: FALLBACK_TRUST, businessTypes: FALLBACK_BIZ }; }
}

export default async function HomePage() {
  const [featured, categories, homeContent] = await Promise.all([
    getFeaturedProducts(), getCategories(), getHomeContent(),
  ]);
  const trustFeatures = homeContent.trustFeatures?.length ? homeContent.trustFeatures : FALLBACK_TRUST;
  const businessTypes = homeContent.businessTypes?.length ? homeContent.businessTypes : FALLBACK_BIZ;

  return (
    <div>
      {/* Hero — Sunrise gradient */}
      <section className="py-8 px-6" style={{ background: "linear-gradient(135deg, #fff8e1 0%, #ffe0b2 40%, #ffb347 100%)" }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 border border-[#b45309]/30 rounded-full px-3 py-1 text-xs font-semibold text-[#92400e] mb-3 bg-white/40">
              🌿 TELANGANA&apos;S FARM NETWORK
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#78350f] leading-tight drop-shadow-sm">
              Quality food,<br />straight from the field.
            </h1>
            <blockquote className="mt-3 border-l-4 border-[#f59e0b] pl-3 italic text-[#92400e] text-sm max-w-sm bg-white/30 py-1.5 rounded-r-xl">
              &ldquo;The food you eat can be either the safest and most powerful form of medicine, or the slowest form of poison.&rdquo;
            </blockquote>
            <p className="text-[#7c3e00] mt-3 text-base max-w-md leading-relaxed">
              Pure, farm-fresh products delivered directly from local fields to your doorstep — no middlemen, no compromise.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-xs font-semibold text-[#92400e]">Download the app:</span>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.21l11.4-11.4-2.93-2.93L3.18 23.76zm15.8-13.2L5.36 3.44a1.5 1.5 0 0 0-2.18 1.33v14.46l9.06-9.06 6.74 6.73zm1.44-1.04-2.84-1.6-3.07 3.07 3.07 3.07 2.87-1.62A1.5 1.5 0 0 0 20.42 9.52zM4.17.03a1.5 1.5 0 0 0-.99.2l9.46 9.46 2.93-2.93L4.17.03z"/>
                </svg>
                <div><p className="text-[9px] opacity-70">GET IT ON</p><p className="text-xs font-bold">Google Play</p></div>
              </a>
              <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div><p className="text-[9px] opacity-70">DOWNLOAD ON</p><p className="text-xs font-bold">App Store</p></div>
              </a>
            </div>
          </div>

          {/* Hero product images */}
          <div className="flex-1 grid grid-cols-2 gap-3 max-w-md w-full">
            {featured.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/products`}>
                <div className="bg-white/80 backdrop-blur rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  {p.images[0] ? (
                    <img src={imgSrc(p.images[0])} alt={p.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center text-4xl bg-gray-100">📦</div>
                  )}
                  <div className="p-2">
                    <p className="font-bold text-[#1c3a2a] text-xs truncate">{p.name}</p>
                    <p className="text-[#b45309] font-bold text-xs">₹{p.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Category sidebar */}
          <aside className="lg:w-48 shrink-0">
            <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest mb-1">CATEGORIES</p>
            <h2 className="text-lg font-bold text-[#1c3a2a] mb-3">Shop the harvest</h2>
            <ul className="space-y-0.5">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products?category=${cat.slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#e6f4ea] hover:text-[#1c3a2a] transition-colors">
                    <span>{cat.icon}</span>{cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs">{featured.length} featured products</p>
                <h3 className="text-xl font-bold text-[#1c3a2a]">Fresh from local farms</h3>
              </div>
              <Link href="/products" className="text-[#1c3a2a] font-semibold text-sm hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              <FeaturedProducts products={featured} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust + Rooted Section — Sunset gradient */}
      <section className="py-10 px-6" style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)" }}>
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold text-[#7c2d12] mb-2">Where Quality Meets Your Table.</h2>
          <p className="text-[#92400e]">Every product we carry is a promise — grown with care, delivered with honesty.</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {trustFeatures.map(({ icon, title, desc }) => {
            const Icon = ICON_MAP[icon] ?? ShieldCheck;
            return (
              <div key={title} className="bg-white/40 backdrop-blur rounded-2xl p-5">
                <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#7c2d12]" />
                </div>
                <h3 className="text-base font-bold text-[#7c2d12] mb-1">{title}</h3>
                <p className="text-[#92400e] text-sm leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Rooted in Telangana */}
        <div className="max-w-5xl mx-auto pt-8 border-t border-white/30 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#7c2d12] mb-3">Rooted in Telangana.</h2>
            <p className="text-[#92400e] text-sm leading-relaxed mb-2">
              Place2Place bridges the gap between local factories, farms, and your family&apos;s table — starting right here in Telangana.
            </p>
            <p className="text-[#92400e] text-sm leading-relaxed">
              From village rice mills and egg farms to turmeric mills and dairy products — sourced with transparency to support rural livelihoods.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-xs">
            {businessTypes.map((item) => (
              <div key={item} className="bg-white/40 backdrop-blur rounded-xl p-3 text-center text-xs font-semibold text-[#7c2d12]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
