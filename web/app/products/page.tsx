"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Play } from "lucide-react";
import { useCart } from "@/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL;
const MEDIA = "http://localhost:4000";
const VIDEO_LIMIT_SEC = 50;

type Category = { id: string; slug: string; label: string; icon: string };
type Producer = { id: string; name: string; businessName?: string; businessLocation?: string };
type Product = {
  id: string; name: string; description: string; price: number; unit: string;
  variants: string[]; images: string[]; videos: string[]; quantity: number;
  status: string; deliveryTime: string; organic: boolean;
  category: Category; producer: Producer;
};

function mediaSrc(src: string) {
  return src.startsWith("/uploads") ? `${MEDIA}${src}` : src;
}

// ── Product detail modal with 50-second video playback ───────────────────────
function ProductModal({ product, onClose, onAdd }: {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, v: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remaining, setRemaining] = useState(VIDEO_LIMIT_SEC);
  const [playing, setPlaying] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? "");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstVideo = product.videos[0] ? mediaSrc(product.videos[0]) : null;
  const firstImage = product.images[0] ? mediaSrc(product.images[0]) : null;
  const unavailable = product.status === "OUT_OF_STOCK" || product.status === "UPDATING";

  // Start 50-second countdown when video begins playing
  function startTimer() {
    if (intervalRef.current) return;
    setPlaying(true);

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          videoRef.current?.pause();
          setPlaying(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    stopTimerRef.current = setTimeout(() => {
      videoRef.current?.pause();
      setPlaying(false);
    }, VIDEO_LIMIT_SEC * 1000);
  }

  function clearTimers() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
  }

  // Autoplay on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => startTimer()).catch(() => {});
    return () => { clearTimers(); video.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const progressPct = ((VIDEO_LIMIT_SEC - remaining) / VIDEO_LIMIT_SEC) * 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media area */}
        <div className="relative bg-black">
          {firstVideo ? (
            <>
              <video
                ref={videoRef}
                src={firstVideo}
                className="w-full max-h-72 object-contain"
                onPlay={() => { if (!playing) startTimer(); setPlaying(true); }}
                onPause={() => { clearTimers(); setPlaying(false); }}
                playsInline
              />
              {/* 50-sec progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-[#c9a227] transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Timer badge */}
              {playing && (
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {remaining}s
                </span>
              )}
              {!playing && remaining === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-sm font-semibold">50-second preview ended</p>
                </div>
              )}
            </>
          ) : firstImage ? (
            <img src={firstImage} alt={product.name} className="w-full max-h-72 object-contain" />
          ) : (
            <img src={`https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} className="w-full max-h-72 object-cover opacity-60" />
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {product.organic && (
            <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              🌿 Organic
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <p className="text-xs text-gray-400 mb-0.5">{product.category.icon} {product.category.label}</p>
          <h2 className="text-lg font-bold text-[#1c3a2a] mb-1">{product.name}</h2>
          <p className="text-sm text-gray-500 mb-3">{product.description}</p>

          <p className="text-xs text-gray-400 mb-4">
            <span className="font-medium text-gray-600">{product.producer.businessName ?? product.producer.name}</span>
            {product.producer.businessLocation && <span> · {product.producer.businessLocation}</span>}
          </p>

          {product.variants.length > 1 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {product.variants.map((v) => (
                <button key={v} onClick={() => setSelectedVariant(v)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${selectedVariant === v ? "border-[#1c3a2a] bg-[#1c3a2a] text-white" : "border-gray-200 text-gray-600 hover:border-[#1c3a2a]"}`}>
                  {v}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-[#1c3a2a]">₹{product.price.toLocaleString()}</p>
              <p className="text-xs text-gray-400">per {product.unit} · {product.deliveryTime}</p>
            </div>
            <button
              disabled={unavailable}
              onClick={() => { onAdd(product, selectedVariant); onClose(); }}
              className="bg-[#1c3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unavailable ? product.status.replace("_", " ") : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onOpen }: {
  product: Product;
  onAdd: (p: Product, v: string) => void;
  onOpen: (p: Product) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? "");
  const [mediaIndex, setMediaIndex] = useState(0);
  const statusColor: Record<string, string> = {
    AVAILABLE: "text-green-600 bg-green-50",
    LOW_STOCK: "text-amber-600 bg-amber-50",
    OUT_OF_STOCK: "text-red-600 bg-red-50",
    UPDATING: "text-gray-500 bg-gray-50",
  };
  const unavailable = product.status === "OUT_OF_STOCK" || product.status === "UPDATING";
  const hasVideo = product.videos.length > 0;

  const allMedia = [
    ...product.images.map((src) => ({ type: "image" as const, src: mediaSrc(src) })),
    ...product.videos.map((src) => ({ type: "video" as const, src: mediaSrc(src) })),
  ];

  return (
    <div
      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer"
      onClick={() => onOpen(product)}
    >
      {/* Media thumbnail */}
      <div className="relative h-32 bg-gray-100">
        {allMedia.length === 0 ? (
          <img src={`https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} className="w-full h-full object-cover opacity-60" />
        ) : allMedia[mediaIndex].type === "image" ? (
          <img src={allMedia[mediaIndex].src} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="relative w-full h-full">
            <video src={allMedia[mediaIndex].src} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white/90 rounded-full p-2">
                <Play className="w-4 h-4 text-[#1c3a2a] fill-[#1c3a2a]" />
              </div>
            </div>
          </div>
        )}

        {hasVideo && allMedia[mediaIndex].type === "image" && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-full p-1">
            <Play className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        )}

        {allMedia.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {allMedia.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setMediaIndex(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === mediaIndex ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}

        {product.organic && (
          <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">🌿 Organic</span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 mb-0.5">{product.category.icon} {product.category.label}</p>
        <h3 className="text-sm font-bold text-[#1c3a2a] leading-tight mb-0.5">{product.name}</h3>
        <p className="text-[11px] text-gray-500 line-clamp-1 mb-1.5">{product.description}</p>

        <p className="text-[10px] text-gray-400 mb-2 truncate">
          <span className="font-medium text-gray-600">{product.producer.businessName ?? product.producer.name}</span>
          {product.producer.businessLocation && <span> · {product.producer.businessLocation}</span>}
        </p>

        {/* Fixed-height variants row */}
        <div className="min-h-[1.5rem] flex gap-1 flex-wrap items-center mb-2">
          {product.variants.length > 1 && product.variants.map((v) => (
            <button
              key={v}
              onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${selectedVariant === v ? "border-[#1c3a2a] bg-[#1c3a2a] text-white" : "border-gray-200 text-gray-600 hover:border-[#1c3a2a]"}`}>
              {v}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-bold text-[#1c3a2a]">₹{product.price.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusColor[product.status] ?? "bg-gray-50 text-gray-500"}`}>
                {product.status.replace("_", " ")}
              </span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">· {product.deliveryTime}</span>
            </div>
          </div>
          <button
            disabled={unavailable}
            onClick={(e) => { e.stopPropagation(); onAdd(product, selectedVariant); }}
            className="shrink-0 bg-[#1c3a2a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#2d5a3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {unavailable ? product.status.replace("_", " ") : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Products listing ──────────────────────────────────────────────────────────
function ProductsContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") ?? "all");
  const [total, setTotal] = useState(0);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, search]);

  async function loadCategories() {
    try {
      const res = await fetch(`${API}/products/categories`);
      const data = await res.json();
      setCategories([{ id: "all", slug: "all", label: "All products", icon: "🌿" }, ...(data.data ?? []).filter((c: Category) => c.slug !== "all")]);
    } catch {
      // server unavailable — leave category list empty
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("search", search);
      const res = await fetch(`${API}/products?${params}`);
      const data = await res.json();
      setProducts(data.data?.items ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {openProduct && (
        <ProductModal
          product={openProduct}
          onClose={() => setOpenProduct(null)}
          onAdd={addItem}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-[#1c3a2a]" />
              <h2 className="font-bold text-[#1c3a2a]">Filter</h2>
            </div>
            <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest mb-3">Categories</p>
            <ul className="space-y-0.5">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button onClick={() => setActiveCategory(cat.slug)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeCategory === cat.slug ? "bg-[#1c3a2a] text-white font-semibold" : "text-gray-600 hover:bg-[#f8f4ed]"}`}>
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or producers…"
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a]" />
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-gray-500 text-sm"><span className="font-semibold text-[#1c3a2a]">{total}</span> products available</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-52 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-3">🌿</p><p className="text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addItem} onOpen={setOpenProduct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="bg-[#f8f4ed] min-h-screen">
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1c3a2a]">All Products</h1>
          <p className="text-gray-500 text-sm">Fresh from local factories & farms</p>
        </div>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}
