"use client";
import { useState, useRef, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { CartProduct, useCart } from "@/context/CartContext";

const MEDIA = "http://localhost:4000";
const VIDEO_LIMIT_SEC = 50;

function mediaSrc(src: string) {
  return src.startsWith("/uploads") ? `${MEDIA}${src}` : src;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  AVAILABLE:    { label: "Available",    color: "bg-green-100 text-green-700" },
  LOW_STOCK:    { label: "Low Stock",    color: "bg-amber-100 text-amber-700" },
  OUT_OF_STOCK: { label: "Out of Stock", color: "bg-red-100 text-red-600" },
  UPDATING:     { label: "Updating",     color: "bg-gray-100 text-gray-600" },
};

function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remaining, setRemaining] = useState(VIDEO_LIMIT_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          video.pause();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(intervalRef.current!);
      video.pause();
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const progressPct = ((VIDEO_LIMIT_SEC - remaining) / VIDEO_LIMIT_SEC) * 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-black rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <video
            ref={videoRef}
            src={src}
            className="w-full max-h-80 object-contain"
            playsInline
          />

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-[#c9a227] transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Countdown badge */}
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {remaining}s
          </span>

          {remaining === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-white text-sm font-semibold">50-second preview ended</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: { product: CartProduct }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? "Standard");
  const [added, setAdded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { addItem } = useCart();

  const effectiveStatus =
    product.quantity === 0 ? "OUT_OF_STOCK"
    : product.quantity < 10 ? "LOW_STOCK"
    : product.status === "UPDATING" ? "UPDATING"
    : "AVAILABLE";
  const status = statusConfig[effectiveStatus];
  const unavailable = effectiveStatus === "OUT_OF_STOCK" || effectiveStatus === "UPDATING";

  const thumb = product.images[0] ? mediaSrc(product.images[0]) : null;
  const firstVideo = product.videos[0] ? mediaSrc(product.videos[0]) : null;
  const placeholder = `https://picsum.photos/seed/${product.id}/400/300`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      {showVideo && firstVideo && (
        <VideoModal src={firstVideo} onClose={() => setShowVideo(false)} />
      )}

      <div
        className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#ede8df] ${firstVideo ? "cursor-pointer" : ""}`}
        onClick={() => firstVideo && setShowVideo(true)}
      >
        <div className="relative h-28 bg-gray-100">
          <img
            src={thumb ?? placeholder}
            alt={product.name}
            className={`w-full h-full object-cover ${!thumb ? "opacity-60" : ""}`}
          />
          {product.organic && (
            <span className="absolute top-2 left-2 bg-[#1c3a2a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              ORGANIC
            </span>
          )}
          {firstVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 rounded-full p-2">
                <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          )}
        </div>

        <div className="p-2.5">
          <p className="text-[10px] text-[#c9a227] font-semibold uppercase tracking-wide mb-0.5 truncate">
            {product.category.icon} {product.producer.businessName ?? product.producer.name}
          </p>
          <h3 className="font-bold text-[#1c3a2a] text-xs leading-tight truncate">{product.name}</h3>

          <p className="text-sm font-bold text-[#1c3a2a] mt-1">
            ₹{product.price.toLocaleString()}
            <span className="text-[10px] font-normal text-gray-400"> / {product.unit}</span>
          </p>

          {product.variants.filter(Boolean).length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {product.variants.filter(Boolean).map((v) => (
                <button
                  key={v}
                  onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                    selectedVariant === v
                      ? "bg-[#1c3a2a] text-white border-[#1c3a2a]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1c3a2a]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>
              {status.label}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={unavailable || added}
              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                added
                  ? "bg-green-600 text-white"
                  : unavailable
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#1c3a2a] text-white hover:bg-[#2d5a3d]"
              }`}
            >
              {added ? <><CheckCircle className="w-3 h-3" /> Added!</> : unavailable ? status.label : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
