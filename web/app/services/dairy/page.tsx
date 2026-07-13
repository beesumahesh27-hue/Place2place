"use client";
import { useEffect, useState } from "react";
import { Milk, Droplets, Phone } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Farm = {
  name: string;
  mobile: string;
  cows: string;
  location: string;
  products: string;
  certified: boolean;
  cowsCount: number;
  since: string;
};

type WhyA2Item  = { icon: string; title: string; desc: string };
type CompRow    = [string, string, string];
type StatItem   = { v: string | null; l: string };

type Content = {
  whyA2: WhyA2Item[];
  comparison: CompRow[];
  stats: StatItem[];
};

export default function DairyPage() {
  const [farms, setFarms]     = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content>({ whyA2: [], comparison: [], stats: [] });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/services/dairy`).then((r) => r.json()),
      fetch(`${API}/services/content/dairy`).then((r) => r.json()),
    ]).then(([fd, cd]) => {
      setFarms(fd.data ?? []);
      if (cd.data) setContent(cd.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = content.stats.map((s) =>
    s.v === null ? { v: loading ? "—" : String(farms.length), l: s.l } : s
  );

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-white via-[#f0eeea] to-[#e8e4df] px-6 py-12 md:py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#1c3a2a]/10 rounded-2xl flex items-center justify-center shrink-0">
              <Milk className="w-7 h-7 text-[#1c3a2a]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1c3a2a]">Dairy Linked</h1>
              <p className="text-gray-500 text-sm mt-0.5">Farm-fresh milk & dairy every morning</p>
            </div>
          </div>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl mt-4">
            Our dairy network connects you directly with certified A2 milk farms and local dairy co-operatives.
            Products are collected before 5 AM and delivered fresh to your door — no pasteurisation plant delays, no preservatives.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats bar */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-[#1c3a2a]">{s.v}</p>
                <p className="text-xs text-gray-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Why A2 */}
          {content.whyA2.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">Why A2 Milk?</h2>
              <div className="space-y-5">
                {content.whyA2.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <Milk className="w-5 h-5 text-[#1c3a2a]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c3a2a]">{title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A1 vs A2 comparison */}
          {content.comparison.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">A1 vs A2 Milk</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-[#1c3a2a] rounded-l-xl">Parameter</th>
                      <th className="text-center px-4 py-2.5 text-xs font-bold text-red-400">A1 (Commercial)</th>
                      <th className="text-center px-4 py-2.5 text-xs font-bold text-green-600 rounded-r-xl">A2 (P2P)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {content.comparison.map(([param, a1, a2]) => (
                      <tr key={param} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{param}</td>
                        <td className="px-4 py-3 text-xs text-center text-red-500">{a1}</td>
                        <td className="px-4 py-3 text-xs text-center text-green-600 font-semibold">{a2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Droplets className="w-5 h-5 text-[#1c3a2a] shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-[#1c3a2a]">Morning collection:</strong> Our dairy riders collect directly from farms between 4:30 – 6:00 AM and deliver chilled to your door by 8 AM.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Farms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="font-bold text-[#1c3a2a] text-lg">Linked Dairy Farms</h2>
            <p className="text-xs text-gray-400 mt-0.5">Farms we source from directly</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading farms…</div>
          ) : farms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Milk className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No dairy farms yet</p>
              <p className="text-xs">Dairy producers who register on the platform will appear here.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {farms.map((f) => (
                  <div key={f.name} className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-[#1c3a2a] text-sm shrink-0">
                        {f.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1c3a2a]">{f.name}</p>
                        {f.certified && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">FSSAI ✓</span>}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 mb-4">
                      <p><span className="font-semibold text-gray-700">Breed:</span> {f.cows}</p>
                      <p><span className="font-semibold text-gray-700">Location:</span> {f.location}</p>
                      <p><span className="font-semibold text-gray-700">Products:</span> {f.products}</p>
                      <p><span className="font-semibold text-gray-700">Cattle:</span> {f.cowsCount} cows</p>
                      <p><span className="font-semibold text-gray-700">Partner since:</span> {f.since}</p>
                    </div>
                    <a
                      href={`tel:${f.mobile.startsWith("+") ? f.mobile : `+91${f.mobile}`}`}
                      className="flex items-center justify-center gap-2 w-full bg-[#1c3a2a] hover:bg-[#2d5a3d] text-white font-semibold py-2 rounded-xl transition-colors text-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Farm
                      <span className="text-white/60 font-normal">{f.mobile}</span>
                    </a>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-gray-50/60 border-t border-gray-100 text-xs text-gray-500">
                {farms.length} registered {farms.length === 1 ? "farm" : "farms"} · {farms.filter((f) => f.certified).length} FSSAI certified
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
