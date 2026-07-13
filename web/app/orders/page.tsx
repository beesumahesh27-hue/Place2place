"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Package, MapPin, CreditCard, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const STATUS_STEPS = ["confirmed", "processing", "packed", "out_for_delivery", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  confirmed:        "Order Placed",
  processing:       "Accepted",
  packed:           "Packed",
  out_for_delivery: "Shipped",
  delivered:        "Delivered",
};

const STATUS_MAP: Record<string, string> = {
  CONFIRMED:        "confirmed",
  PROCESSING:       "processing",
  PACKED:           "packed",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED:        "delivered",
  CANCELLED:        "confirmed",
};

type DisplayOrder = {
  id: string;
  date: string;
  items: { name: string; variant: string; qty: number; price: number }[];
  total: number;
  address: string;
  status: typeof STATUS_STEPS[number];
  paymentMethod: string;
  cancelled: boolean;
};

function mapBackendOrder(o: Record<string, unknown>): DisplayOrder {
  const addr = o.address as Record<string, string> | null;
  const addrStr = addr
    ? [addr.flat, addr.street, addr.city, addr.state].filter(Boolean).join(", ")
    : "—";
  const rawItems = (o.items as Record<string, unknown>[]) ?? [];
  return {
    id:            o.id as string,
    date:          new Date(o.createdAt as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    items:         rawItems.map((i) => {
      const prod = i.product as Record<string, unknown> | null;
      return {
        name:    (prod?.name as string) ?? "Item",
        variant: i.variant as string,
        qty:     i.quantity as number,
        price:   i.price as number,
      };
    }),
    total:         o.total as number,
    address:       addrStr,
    status:        (STATUS_MAP[o.status as string] ?? "confirmed") as DisplayOrder["status"],
    paymentMethod: o.paymentMethod as string,
    cancelled:     o.status === "CANCELLED",
  };
}

export default function OrdersPage() {
  const { isLoggedIn, token } = useAuth();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  async function handleConfirmDelivery(orderId: string) {
    setConfirming(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}/confirm-delivery`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "delivered" } : o));
      setConfirmed(orderId);
    } catch { /* silent */ } finally {
      setConfirming(null);
    }
  }

  useEffect(() => {
    if (!isLoggedIn || !token) { setLoading(false); return; }
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setOrders((data.data ?? []).map(mapBackendOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, token]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex flex-col items-center justify-center gap-4">
        <Package className="w-14 h-14 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">Please sign in to view orders</h2>
        <Link href="/auth/login" className="bg-[#1c3a2a] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#2d5a3d]">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#1c3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex flex-col items-center justify-center gap-4">
        <Package className="w-14 h-14 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">No orders yet</h2>
        <Link href="/products" className="bg-[#1c3a2a] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#2d5a3d]">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1c3a2a] mb-6">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order) => {
            const stepIdx = STATUS_STEPS.indexOf(order.status);
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#fafafa] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#e8f0eb] rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-[#1c3a2a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#1c3a2a] text-sm font-mono">{order.id.slice(0, 14)}…</p>
                      {order.cancelled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Cancelled</span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === "delivered"        ? "bg-green-100 text-green-700"  :
                          order.status === "out_for_delivery" ? "bg-indigo-100 text-indigo-700" :
                          order.status === "packed"           ? "bg-blue-100 text-blue-700"    :
                          order.status === "processing"       ? "bg-amber-100 text-amber-700"  :
                                                                "bg-gray-100 text-gray-500"
                        }`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{order.date} · {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.total.toLocaleString()}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Track */}
                    <div>
                      <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest mb-3">Track Order</p>
                      {order.cancelled ? (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                          <span className="text-red-500 font-bold text-sm">✕</span>
                          <span className="text-red-600 text-sm font-semibold">This order was cancelled.</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            {STATUS_STEPS.map((s, i) => (
                              <div key={s} className="flex items-center flex-1">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-colors ${i <= stepIdx ? "bg-[#1c3a2a] border-[#1c3a2a] text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                                  {i <= stepIdx ? "✓" : i + 1}
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`flex-1 h-0.5 transition-colors ${i < stepIdx ? "bg-[#1c3a2a]" : "bg-gray-200"}`} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-1">
                            {STATUS_STEPS.map((s) => (
                              <p key={s} className="text-[9px] text-gray-400 text-center flex-1 leading-tight">{STATUS_LABELS[s]}</p>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Items</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name} <span className="text-gray-400">({item.variant})</span> × {item.qty}</span>
                            <span className="font-semibold text-[#1c3a2a]">₹{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address + payment */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#f8f4ed] rounded-xl p-3">
                        <div className="flex items-center gap-1 font-bold text-gray-600 mb-1"><MapPin className="w-3 h-3" />Delivery To</div>
                        <p className="text-gray-500 leading-relaxed">{order.address}</p>
                      </div>
                      <div className="bg-[#f8f4ed] rounded-xl p-3">
                        <div className="flex items-center gap-1 font-bold text-gray-600 mb-1"><CreditCard className="w-3 h-3" />Payment</div>
                        <p className="text-gray-500">{order.paymentMethod}</p>
                        <p className="font-bold text-[#1c3a2a] mt-1">₹{order.total.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Confirm delivery — shown only when order is out for delivery */}
                    {order.status === "out_for_delivery" && !order.cancelled && (
                      confirmed === order.id ? (
                        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-sm font-semibold text-green-700">Delivery confirmed — thank you!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmDelivery(order.id)}
                          disabled={confirming === order.id}
                          className="w-full flex items-center justify-center gap-2 bg-[#1c3a2a] text-white font-semibold py-3 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-50 text-sm"
                        >
                          {confirming === order.id
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                            : <><CheckCircle2 className="w-4 h-4" /> I received my order</>}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
