"use client";
import { useEffect, useState } from "react";
import { Wheat, MapPin } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Mill = {
  name: string;
  location: string;
  method: string;
  curcumin: string;
  since: string;
  capacity: string;
};

type Feature      = { icon: string; title: string; desc: string };
type CurcuminRow  = { label: string; pct: number; color: string };
type StatItem     = { v: string | null; l: string };

type Content = {
  features: Feature[];
  millingSteps: string[];
  curcuminComparison: CurcuminRow[];
  stats: StatItem[];
};

export default function TurmericPage() {
  const [mills, setMills]     = useState<Mill[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content>({
    features: [], millingSteps: [], curcuminComparison: [], stats: [],
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/services/turmeric`).then((r) => r.json()),
      fetch(`${API}/services/content/turmeric`).then((r) => r.json()),
    ]).then(([md, cd]) => {
      setMills(md.data ?? []);
      if (cd.data) setContent(cd.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = content.stats.map((s) =>
    s.v === null ? { v: loading ? "—" : String(mills.length), l: s.l } : s
  );

  return (
    <div className="min-h-screen bg-[#f8f4ed]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Wheat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Turmeric Mill Linked</h1>
              <p className="text-white/60 text-sm mt-0.5">Stone-ground spice from Telangana farms</p>
            </div>
          </div>
          <p className="text-white/80 text-base leading-relaxed max-w-2xl mt-4">
            Our turmeric comes exclusively from stone-grinding mills in Nellore and Karimnagar.
            No chemical bleaching, no preservatives. You get the real golden powder with naturally high curcumin content.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <p className="text-3xl font-bold text-yellow-600">{s.v}</p>
                <p className="text-sm text-gray-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Features */}
          {content.features.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">What Makes Ours Different</h2>
              <div className="space-y-5">
                {content.features.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                      <Wheat className="w-5 h-5 text-yellow-600" />
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

          {/* Curcumin comparison + milling steps */}
          <div className="space-y-6">
            {content.curcuminComparison.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">Curcumin Comparison</h2>
                {content.curcuminComparison.map((q) => (
                  <div key={q.label} className="mb-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                      <span>{q.label}</span>
                      <span className="text-yellow-700">{q.pct}% relative</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${q.color} rounded-full`} style={{ width: `${q.pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 mt-3">*Relative curcumin index based on independent lab testing. Not a medical claim.</p>
              </div>
            )}

            {content.millingSteps.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-[#1c3a2a] text-lg mb-4">Milling Process</h2>
                {content.millingSteps.map((step, i) => (
                  <div key={step} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mills table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1c3a2a] text-lg">Linked Mills</h2>
            <p className="text-xs text-gray-400 mt-0.5">Registered stone-grinding partners</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading mills…</div>
          ) : mills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Wheat className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No turmeric mills yet</p>
              <p className="text-xs">Spice mill producers who register on the platform will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f4ed]">
                    <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Mill Name</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Location</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Method</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Curcumin</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Capacity</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Partner Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mills.map((m, i) => (
                    <tr key={`${m.name}-${i}`} className="hover:bg-[#fffdf5] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#1c3a2a]">{m.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span></td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{m.method}</td>
                      <td className="px-6 py-4 text-center"><span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full">{m.curcumin}</span></td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">{m.capacity}</td>
                      <td className="px-6 py-4 text-center"><span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">{m.since}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-[#f8f4ed] text-xs text-gray-500">
                {mills.length} registered {mills.length === 1 ? "mill" : "mills"}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
