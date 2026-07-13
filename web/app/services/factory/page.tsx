"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Factory, MapPin, ExternalLink, Phone } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const CATEGORY_STYLE: Record<string, string> = {
  "Spice Mill": "bg-yellow-100 text-yellow-700",
  "Snacks":     "bg-orange-100 text-orange-700",
  "Pickles":    "bg-green-100  text-green-700",
  "Oil Mill":   "bg-amber-100  text-amber-700",
  "Rice Mill":  "bg-sky-100    text-sky-700",
  "Dry Fruits": "bg-rose-100   text-rose-700",
  "Dairy":      "bg-blue-100   text-blue-700",
  "Other":      "bg-gray-100   text-gray-700",
};

const C = {
  hero:    "bg-gradient-to-br from-[#5a5a52] to-[#3d3d36]",
  dark:    "#3d3d36",
  iconBg:  "bg-[#e8e6e0]",
  barFill: "bg-[#6b6b60]",
  tblHead: "bg-[#f0eee9]",
  footer:  "bg-[#f0eee9]",
};

type Partner = { name: string; owner: string; mobile: string; location: string; product: string; items: number; category: string; since: string };
type Step    = { icon: string; title: string; desc: string };
type Quality = { label: string; pct: number };
type Content = { processSteps: Step[]; qualityStandards: Quality[] };

export default function FactoryPage() {
  const [partners, setPartners]             = useState<Partner[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [content, setContent]               = useState<Content>({ processSteps: [], qualityStandards: [] });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/services/factory`).then((r) => r.json()),
      fetch(`${API}/services/content/factory`).then((r) => r.json()),
    ]).then(([pd, cd]) => {
      setPartners(pd.data ?? []);
      if (cd.data) setContent(cd.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(partners.map((p) => p.category))];
  const filtered   = activeCategory === "All" ? partners : partners.filter((p) => p.category === activeCategory);
  const totalSKUs  = filtered.reduce((s, p) => s + p.items, 0);

  const stats = [
    { label: "Partner Factories", value: partners.length > 0 ? `${partners.length}+` : "—" },
    { label: "Products Listed",   value: partners.reduce((s, p) => s + p.items, 0) > 0 ? `${partners.reduce((s, p) => s + p.items, 0)}+` : "—" },
    { label: "Districts Covered", value: partners.length > 0 ? `${new Set(partners.map((p) => p.location.split(",")[0])).size}` : "—" },
    { label: "Avg. Lead Time",    value: "2 hrs" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f0ec]">

      {/* Hero */}
      <div className={`${C.hero} px-6 py-12 md:py-16`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Industry Partners</h1>
              <p className="text-white/55 text-sm mt-0.5">Local producers directly connected to your table</p>
            </div>
          </div>
          <p className="text-white/70 text-base leading-relaxed max-w-2xl mt-4">
            Place2Place partners with certified local factories and small-scale producers across Telangana and Andhra Pradesh —
            spice mills, mirchi processors, snack makers, pickle houses and more.
          </p>
          <div className="mt-6 h-1 w-24 rounded-full bg-white/25" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[#e0ddd8]">
              <p className="text-3xl font-bold" style={{ color: C.dark }}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isAll  = cat === "All";
              const active = activeCategory === cat;
              const style  = !isAll && CATEGORY_STYLE[cat] ? CATEGORY_STYLE[cat] : "";
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                    active
                      ? isAll ? "bg-[#3d3d36] text-white border-[#3d3d36]" : `${style} border-current`
                      : isAll ? "bg-white text-gray-600 border-gray-200 hover:border-[#3d3d36]"
                               : `${style} opacity-60 border-transparent hover:opacity-100`
                  }`}
                >
                  {cat}
                  {!isAll && <span className="ml-1 opacity-70">({partners.filter((p) => p.category === cat).length})</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* Process steps */}
          {content.processSteps.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0ddd8] p-6">
              <h2 className="font-bold text-lg mb-5" style={{ color: C.dark }}>How Industry Linking Works</h2>
              <div className="space-y-5">
                {content.processSteps.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${C.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <Factory className="w-5 h-5" style={{ color: C.dark }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.dark }}>{title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality standards */}
          {content.qualityStandards.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0ddd8] p-6">
              <h2 className="font-bold text-lg mb-5" style={{ color: C.dark }}>Our Quality Standards</h2>
              <div className="space-y-4">
                {content.qualityStandards.map((q) => (
                  <div key={q.label}>
                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                      <span>{q.label}</span>
                      <span style={{ color: C.dark }}>{q.pct}%</span>
                    </div>
                    <div className="h-2.5 bg-[#e8e6e0] rounded-full overflow-hidden">
                      <div className={`h-full ${C.barFill} rounded-full`} style={{ width: `${q.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-[#f0eee9] border border-[#e0ddd8] rounded-xl p-4">
                <p className="text-xs font-bold mb-1" style={{ color: C.dark }}>Monthly Audit</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Every partner factory undergoes a surprise monthly audit by our quality team. Factories that fall below standards are paused until resolved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Partners table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0ddd8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e0ddd8] bg-[#f5f4f0] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg" style={{ color: C.dark }}>
                {activeCategory === "All" ? "Active Industry Partners" : `${activeCategory} Partners`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} {filtered.length === 1 ? "partner" : "partners"}
              </p>
            </div>
            {activeCategory !== "All" && (
              <button onClick={() => setActiveCategory("All")} className="text-xs text-gray-500 hover:text-[#3d3d36] font-semibold">
                Clear filter ×
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading partners…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Factory className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">
                {partners.length === 0 ? "No factory partners yet" : `No ${activeCategory} partners`}
              </p>
              <p className="text-xs">
                {partners.length === 0 ? "Producers who register on the platform will appear here." : "Try selecting a different category."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={C.tblHead}>
                      {["#", "Factory / Industry", "Owner", "Location", "Products Made", "SKUs", "Category", "Since", "Actions"].map((h, i) => (
                        <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wide ${
                          i === 0 ? "" : i >= 2 && i <= 4 ? "hidden md:table-cell" : i === 5 ? "hidden md:table-cell text-center" : i === 7 ? "hidden sm:table-cell text-center" : i === 8 ? "text-center" : ""
                        }`} style={{ color: C.dark }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eee9]">
                    {filtered.map((p, i) => (
                      <tr key={`${p.name}-${i}`} className="hover:bg-[#f5f4f0] transition-colors">
                        <td className="px-4 py-4 text-gray-400 text-xs font-semibold">{i + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${C.iconBg} rounded-xl flex items-center justify-center font-bold text-xs shrink-0`} style={{ color: C.dark }}>
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-xs" style={{ color: C.dark }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 text-gray-600 text-xs font-semibold">{p.owner}</td>
                        <td className="hidden md:table-cell px-4 py-4 text-gray-500 text-xs">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{p.location}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 text-gray-600 text-xs max-w-[180px]">
                          <span className="line-clamp-2">{p.product}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 text-center font-bold" style={{ color: C.dark }}>{p.items}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setActiveCategory(p.category)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLE[p.category] ?? "bg-gray-100 text-gray-700"} hover:opacity-80 transition-opacity`}>
                            {p.category}
                          </button>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 text-center">
                          <span className="text-xs bg-[#e8e6e0] font-semibold px-3 py-1 rounded-full" style={{ color: C.dark }}>{p.since}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link href={`/products?search=${encodeURIComponent(p.name)}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3d3d36] bg-[#e8e6e0] hover:bg-[#d8d6d0] px-2.5 py-1 rounded-full transition-colors">
                              View <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                            <a href={`tel:${p.mobile.startsWith("+") ? p.mobile : `+91${p.mobile}`}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#1c3a2a] hover:bg-[#2d5a3d] px-2.5 py-1 rounded-full transition-colors">
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`px-6 py-3 ${C.footer} text-xs text-gray-500 flex flex-wrap gap-4`}>
                <span>Showing: <strong style={{ color: C.dark }}>{filtered.length}</strong> of <strong style={{ color: C.dark }}>{partners.length}</strong> partners</span>
                <span>SKUs: <strong style={{ color: C.dark }}>{totalSKUs}</strong></span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
