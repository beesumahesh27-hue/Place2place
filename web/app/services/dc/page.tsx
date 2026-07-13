"use client";
import { useEffect, useState } from "react";
import { Truck, Clock, MapPin, ShieldCheck, Package, Users, Zap, BarChart3 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Hub = {
  name: string;
  area: string;
  slots: string;
  bikes: number;
  orders: string;
  temp: string;
};

const howItWorks = [
  { icon: Package,     title: "Order Received",       desc: "Your order hits the nearest DC within seconds of placement. Smart routing picks the closest available rider." },
  { icon: ShieldCheck, title: "Quality Check",        desc: "Every item is weighed, inspected, and packed in compostable packaging. Mismatched items trigger an automatic repack." },
  { icon: Truck,       title: "Rider Assigned",       desc: "An EV rider is auto-assigned based on proximity and load. Real-time GPS tracking enabled from pickup to door." },
  { icon: Clock,       title: "30–90 Min Delivery",   desc: "Most deliveries within 45 minutes. Fresh food, not 2-day delayed parcels with broken cold chain." },
  { icon: Users,       title: "Community Riders",     desc: "Riders are local community members — trained and paid above-minimum wage with performance bonuses." },
  { icon: Zap,         title: "EV Fleet",             desc: "100% electric two-wheelers. Zero tailpipe emissions, lower operating cost, silent neighbourhood deliveries." },
];

const metrics = [
  { label: "On-time Delivery Rate",  pct: 94 },
  { label: "Order Accuracy",          pct: 98 },
  { label: "Customer Satisfaction",   pct: 91 },
  { label: "EV Uptime",               pct: 97 },
  { label: "Cold-chain Integrity",    pct: 99 },
];

export default function DCPage() {
  const [hubs, setHubs]     = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/services/dc`)
      .then((r) => r.json())
      .then((res) => setHubs(res.data ?? []))
      .catch(() => setHubs([]))
      .finally(() => setLoading(false));
  }, []);

  const totalRiders = hubs.reduce((s, h) => s + h.bikes, 0);

  const stats = [
    { v: loading ? "—" : String(hubs.length),   l: "Active DCs" },
    { v: loading ? "—" : String(totalRiders),    l: "Riders" },
    { v: "45 min", l: "Avg Delivery" },
    { v: "EV",     l: "Vehicles" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f4ed]">
      {/* Hero */}
      <div className="px-6 py-12 md:py-16" style={{ background: "linear-gradient(135deg, #e8d5b7 0%, #d4b896 50%, #c4a07a 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(92,61,30,0.15)" }}>
              <Truck className="w-7 h-7" style={{ color: "#5C3D1E" }} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#5C3D1E" }}>About Our DC</h1>
              <p className="text-sm mt-0.5" style={{ color: "#8B6040" }}>Delivery Centres powering last-mile freshness</p>
            </div>
          </div>
          <p className="text-base leading-relaxed max-w-2xl mt-4" style={{ color: "#7B5030" }}>
            Place2Place operates dedicated Delivery Centres (DCs) that act as the bridge between factory/farm and your door.
            Each DC is temperature-controlled, FSSAI-compliant, and staffed with trained delivery partners on electric vehicles.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.l} className="bg-white rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-indigo-700">{s.v}</p>
              <p className="text-sm text-gray-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* How DC works */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">How Our DC Works</h2>
            <div className="space-y-5">
              {howItWorks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c3a2a]">{title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance + throughput */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-5">
                <BarChart3 className="inline w-5 h-5 mr-2 text-indigo-600" />
                DC Performance Metrics
              </h2>
              {metrics.map((q) => (
                <div key={q.label} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>{q.label}</span><span className="text-indigo-700">{q.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${q.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-4">Daily Throughput</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: "470+",    l: "Orders/day" },
                  { v: "1,200+", l: "Items packed" },
                  { v: "< 2 hrs", l: "Max hold time" },
                ].map((s) => (
                  <div key={s.l} className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-lg font-bold text-indigo-700">{s.v}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Data from April 2026. Throughput grows ~12% month-on-month.</p>
            </div>
          </div>
        </div>

        {/* DC Locations */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1c3a2a] text-lg">DC Locations</h2>
            <p className="text-xs text-gray-400 mt-0.5">All active delivery centres</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading hubs…</div>
          ) : hubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Truck className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No delivery centres yet</p>
              <p className="text-xs">DC operators who register on the platform will appear here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f4ed]">
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">DC Name</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Coverage Area</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Operating Hours</th>
                      <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Riders</th>
                      <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Capacity</th>
                      <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Cold Storage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {hubs.map((h, i) => (
                      <tr key={`${h.name}-${i}`} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#1c3a2a]">{h.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs max-w-[220px]">
                          <span className="flex items-start gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{h.area}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" />{h.slots}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">{h.bikes} riders</span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-gray-500">{h.orders}</td>
                        <td className="px-6 py-4 text-center text-xs font-semibold text-indigo-600">{h.temp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-[#f8f4ed] text-xs text-gray-500">
                Total riders: <strong className="text-indigo-700">{totalRiders}</strong> across {hubs.length} {hubs.length === 1 ? "DC" : "DCs"} · All vehicles are electric
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
