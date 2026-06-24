"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Package, Clock, CheckCircle, Truck, Bell, Factory, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Delivery = {
  id: string;
  orderId: string;
  customer: string;
  mobile: string;
  address: string;
  factory: string;
  factoryLocation: string;
  product: string;
  total: number;
  status: "new" | "in_transit";
  createdAt: string;
};

type Stats = {
  newRequests: number;
  inTransit: number;
  deliveredToday: number;
  earnings: number;
};

type DCFactory = {
  name: string;
  type: string;
  location: string;
  items: number;
  stock: "High" | "Medium" | "Low" | "Out" | "Updating";
};

type DCProfile = {
  hubName: string;
  location: string;
  coverageAreas: string;
  operatingHours: string;
  riderCount: number;
};

const STATUS_CONFIG = {
  new:       { label: "New Request", color: "bg-amber-100 text-amber-700 border-amber-200" },
  in_transit: { label: "In Transit",  color: "bg-blue-100 text-blue-700 border-blue-200"   },
};

const STOCK_COLOR: Record<string, string> = {
  High:     "bg-green-100 text-green-700",
  Medium:   "bg-amber-100 text-amber-700",
  Low:      "bg-red-100 text-red-600",
  Out:      "bg-red-100 text-red-600",
  Updating: "bg-gray-100 text-gray-600",
};

export default function DCDashboard() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"deliveries" | "factories">("deliveries");

  const [profile, setProfile]       = useState<DCProfile | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [factories, setFactories]   = useState<DCFactory[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState<string | null>(null);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [pRes, dRes, sRes, fRes] = await Promise.all([
        fetch(`${API}/dc/profile`,    { headers: authHeaders() }),
        fetch(`${API}/dc/deliveries`, { headers: authHeaders() }),
        fetch(`${API}/dc/stats`,      { headers: authHeaders() }),
        fetch(`${API}/dc/factories`,  { headers: authHeaders() }),
      ]);
      const [pD, dD, sD, fD] = await Promise.all([pRes.json(), dRes.json(), sRes.json(), fRes.json()]);
      setProfile(pD.data ?? null);
      setDeliveries(dD.data ?? []);
      setStats(sD.data ?? null);
      setFactories(fD.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (!isLoggedIn) { router.push("/auth/register"); return; }
    fetchAll();
  }, [isLoggedIn, router, fetchAll]);

  const handleAccept = async (orderId: string) => {
    setActing(orderId);
    await fetch(`${API}/dc/deliveries/${orderId}/accept`, { method: "PATCH", headers: authHeaders() });
    await fetchAll();
    setActing(null);
  };

  const handleDeliver = async (orderId: string) => {
    setActing(orderId);
    await fetch(`${API}/dc/deliveries/${orderId}/deliver`, { method: "PATCH", headers: authHeaders() });
    await fetchAll();
    setActing(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1c3a2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4ed]">
      {/* Header */}
      <div className="bg-[#1c3a2a] px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#c9a227] text-sm font-semibold">Delivery Center</p>
            <h1 className="text-white text-2xl font-bold">{profile?.hubName ?? "DC Hub"}</h1>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-xs">{profile?.location ?? "Active"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAll}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <div className="text-right">
              <p className="text-white/60 text-xs">Today&apos;s earnings</p>
              <p className="text-white text-2xl font-bold">₹{(stats?.earnings ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Bell,         label: "New Requests",   value: String(stats?.newRequests ?? 0),   color: "text-amber-500" },
            { icon: Truck,        label: "In Transit",     value: String(stats?.inTransit ?? 0),     color: "text-blue-500"  },
            { icon: CheckCircle,  label: "Delivered Today", value: String(stats?.deliveredToday ?? 0), color: "text-green-600" },
            { icon: Clock,        label: "Avg. Delivery",  value: "28 min",                          color: "text-[#1c3a2a]" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <p className="text-2xl font-bold text-[#1c3a2a]">{value}</p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
          {(["deliveries", "factories"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-[#1c3a2a] text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "deliveries" ? "🚚 Deliveries" : "🏭 Nearby Factories"}
            </button>
          ))}
        </div>

        {activeTab === "deliveries" ? (
          deliveries.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-400">
              <Truck className="w-12 h-12 opacity-20 mx-auto mb-3" />
              <p className="font-medium">No active deliveries</p>
              <p className="text-xs mt-1">Orders that are packed or in transit will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((d) => {
                const sc = STATUS_CONFIG[d.status];
                const busy = acting === d.orderId;
                return (
                  <div key={d.id} className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-[#1c3a2a]">{d.id}</span>
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                            {d.status === "new" ? <Bell className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            {sc.label}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(d.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                            <p className="font-medium text-gray-800">{d.customer}</p>
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />{d.address}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Pickup From</p>
                            <p className="font-medium text-gray-800">{d.factory}</p>
                            <p className="text-gray-500 text-xs truncate">{d.product}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Order Value</p>
                            <p className="font-medium text-gray-800 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-[#c9a227]" />₹{d.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col shrink-0">
                        {d.status === "new" && (
                          <button
                            onClick={() => handleAccept(d.orderId)}
                            disabled={busy}
                            className="flex-1 bg-[#1c3a2a] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                            Accept
                          </button>
                        )}
                        {d.status === "in_transit" && (
                          <button
                            onClick={() => handleDeliver(d.orderId)}
                            disabled={busy}
                            className="bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          factories.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-400">
              <Factory className="w-12 h-12 opacity-20 mx-auto mb-3" />
              <p className="font-medium">No factories registered yet</p>
              <p className="text-xs mt-1">Producers who register on the platform will appear here.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {factories.map((f) => (
                <div key={f.name} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#e8f0eb] rounded-xl flex items-center justify-center text-xl">🏭</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STOCK_COLOR[f.stock] ?? "bg-gray-100 text-gray-600"}`}>
                      {f.stock} Stock
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1c3a2a] mb-1">{f.name}</h3>
                  <p className="text-gray-500 text-xs mb-2">{f.type} · {f.items} SKUs</p>
                  {f.location && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3" />{f.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
