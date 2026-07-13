"use client";
import { useEffect, useState } from "react";
import { Leaf, Users, TrendingUp, Heart, MapPin, Sprout, Phone, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Farmer = {
  name:    string;
  mobile:  string;
  village: string;
  crop:    string;
  acres:   number;
  organic: boolean;
  since:   string;
};

type PriceRow  = { crop: string; mandi: number; p2p: number };
type Content   = { priceComparison: PriceRow[]; betterPay: string; extraEarnings: string };

const ICON_MAP: Record<string, React.ElementType> = { TrendingUp, Users, Heart, Sprout };

const COMMITMENT = [
  { icon: "TrendingUp", title: "Fair Price Guarantee",   desc: "Farmers get a minimum support price 30% above mandi rates, paid within 48 hours of delivery. No payment delays, no deductions." },
  { icon: "Users",      title: "Training & Support",     desc: "Monthly workshops on organic farming, water conservation, and crop diversification to increase yield and soil health." },
  { icon: "Heart",      title: "Women-led Farms",        desc: "40% of our partner farmers are women-led SHG (Self Help Group) members. We prioritise onboarding women growers." },
  { icon: "Sprout",     title: "Soil Health Program",    desc: "We fund soil testing for each partner farm annually and advise on natural composting to reduce input costs by up to 25%." },
];

export default function FarmerPage() {
  const [farmers, setFarmers]   = useState<Farmer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [content, setContent]   = useState<Content>({
    priceComparison: [],
    betterPay:    "35%",
    extraEarnings: "₹18.4 Lakhs",
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/services/farmer`).then((r) => r.json()),
      fetch(`${API}/services/content/farmer`).then((r) => r.json()),
    ]).then(([fd, cd]) => {
      setFarmers(fd.data ?? []);
      if (cd.data) setContent(cd.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q) ||
      f.crop.toLowerCase().includes(q)
    );
  });

  const organicCount = farmers.filter((f) => f.organic).length;
  const totalAcres   = farmers.reduce((s, f) => s + (f.acres || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f4ed]">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-700 via-emerald-800 to-green-900 px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Farmer Network</h1>
              <p className="text-white/60 text-sm mt-0.5">Empowering rural Telangana & AP farmers</p>
            </div>
          </div>
          <p className="text-white/75 text-base leading-relaxed max-w-2xl mt-4">
            Every purchase you make supports a real farmer. Place2Place pays farmers 30–40% more than traditional mandis
            by eliminating brokers. Our network spans 4 districts across Telangana and Andhra Pradesh.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: farmers.length > 0 ? String(farmers.length) : "0",     l: "Farmers"      },
            { v: farmers.length > 0 ? String(organicCount) : "0",        l: "Organic Farms" },
            { v: farmers.length > 0 ? totalAcres.toFixed(0) : "0",       l: "Total Acres"   },
            { v: content.betterPay,                                       l: "Better Pay"    },
          ].map((s) => (
            <div key={s.l} className="bg-white rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-700">{s.v}</p>
              <p className="text-sm text-gray-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Commitment ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">Our Commitment</h2>
            <div className="space-y-5">
              {COMMITMENT.map(({ icon, title, desc }) => {
                const Icon = ICON_MAP[icon] ?? Leaf;
                return (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c3a2a]">{title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Price comparison ───────────────────────────────── */}
          <div className="space-y-6">
            {content.priceComparison.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">Price Comparison (per kg)</h2>
                {content.priceComparison.map((r) => (
                  <div key={r.crop} className="mb-5 last:mb-0">
                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                      <span>{r.crop}</span>
                      <span className="text-green-600">+{Math.round(((r.p2p - r.mandi) / r.mandi) * 100)}% vs mandi</span>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gray-300 rounded-full" style={{ width: `${(r.mandi / (r.p2p * 1.15)) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-green-500 rounded-full opacity-80" style={{ width: `${(r.p2p / (r.p2p * 1.15)) * 100}%` }} />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-[10px] font-bold text-white">Mandi ₹{r.mandi}</span>
                        <span className="text-[10px] font-bold text-white">P2P ₹{r.p2p}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-[#e8f0eb] rounded-2xl p-6">
              <p className="text-lg font-bold text-[#1c3a2a] mb-1">{content.extraEarnings}</p>
              <p className="text-sm text-gray-600">Extra earnings delivered to farmer partners in FY 2025–26 vs mandi rates.</p>
              <p className="text-xs text-gray-500 mt-3">Across registered farmers, 12 crop types, 4 districts of Telangana & AP.</p>
            </div>
          </div>
        </div>

        {/* ── Registered Farmers ─────────────────────────────────── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a227]">Our Network</p>
              <h2 className="text-xl font-bold text-[#1c3a2a] mt-0.5">Registered Farmers</h2>
              <p className="text-xs text-gray-400 mt-0.5">Click "Call" to connect directly with any farmer</p>
            </div>
            {farmers.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, village or crop…"
                  className="pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-green-500 w-72"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : farmers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-[#1c3a2a] text-lg mb-2">No farmers registered yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Farmers who register on Place2Place will appear here with their contact details.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <p className="text-gray-500 text-sm">No farmers match &quot;{search}&quot;</p>
              <button onClick={() => setSearch("")} className="mt-3 text-green-600 text-sm font-semibold hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((f, i) => (
                <div key={`${f.name}-${i}`} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-green-700 to-emerald-800 px-5 py-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-lg shrink-0">
                      {f.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{f.name}</p>
                      <p className="text-green-200 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{f.village || "Location not set"}</span>
                      </p>
                    </div>
                    {f.organic && (
                      <span className="ml-auto shrink-0 bg-green-500/30 text-green-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/40">
                        Organic
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sprout className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Crops / Produce</p>
                        <p className="text-sm text-[#1c3a2a] font-semibold mt-0.5">{f.crop || "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#f8f4ed] rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Farm Size</p>
                        <p className="text-sm font-bold text-[#1c3a2a] mt-0.5">{f.acres || 0} acres</p>
                      </div>
                      <div className="bg-[#f8f4ed] rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Farming Since</p>
                        <p className="text-sm font-bold text-[#1c3a2a] mt-0.5">{f.since}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${f.mobile.startsWith("+") ? f.mobile : `+91${f.mobile}`}`}
                      className="flex items-center justify-center gap-2 w-full bg-[#1c3a2a] hover:bg-[#2d5a3d] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Call Farmer
                      <span className="text-white/60 text-xs font-normal">{f.mobile}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && farmers.length > 0 && (
            <p className="mt-4 text-xs text-gray-400 text-center">
              {organicCount} organic · {farmers.length - organicCount} conventional · {totalAcres.toFixed(0)} acres total under partnership
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
