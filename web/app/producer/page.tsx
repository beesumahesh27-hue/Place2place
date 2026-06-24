"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ShoppingBag, Bell, Plus, Pencil, Trash2,
  CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Layers, IndianRupee, BarChart3, TrendingUp,
  X, Upload, Leaf, ChevronRight, Truck, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const MEDIA = "http://localhost:4000";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stats = { totalProducts: number; totalOrders: number; totalRevenue: number; totalStock: number };
type Category = { id: string; slug: string; label: string; icon: string };
type Product = {
  id: string; name: string; description: string; price: number; unit: string;
  variants: string[]; images: string[]; videos: string[]; quantity: number;
  status: string; deliveryTime: string; organic: boolean; category: Category;
};
type OrderItem = { name: string; variant: string; quantity: number; price: number; subtotal: number };
type ProducerOrder = {
  id: string; date: string; subtotal: number; status: string;
  paymentMethod: string; customer: string; mobile: string;
  items: OrderItem[];
  assignment: { status: string; expiresAt: string | null };
};
type Notification =
  | { type: "order";     orderId: string; customer: string; itemCount: number; expiresAt: string | null; urgent: boolean; message: string }
  | { type: "stock";     productId: string; productName: string; quantity: number; unit: string; status: string; image: string | null; urgent: boolean; message: string }
  | { type: "delivered"; id: string; orderId: string; title: string; message: string; read: boolean; createdAt: string; urgent: boolean };
type InventoryRow = {
  id: string; name: string; unit: string; price: number; status: string;
  category: Category; image: string | null;
  uploadedQty: number; soldQty: number; remainingQty: number; revenue: number;
};
type EarningsRow = {
  id: string; name: string; unit: string; category: string; image: string | null;
  soldQty: number; revenue: number; orderCount: number;
};
type Earnings = { rows: EarningsRow[]; totalRevenue: number; totalSold: number };

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:    "bg-green-100 text-green-700",
  LOW_STOCK:    "bg-amber-100 text-amber-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
  UPDATING:     "bg-gray-100 text-gray-500",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  CONFIRMED:        "bg-amber-100 text-amber-700",
  PACKED:           "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  DELIVERED:        "bg-green-100 text-green-700",
  CANCELLED:        "bg-red-100 text-red-700",
};

// ── Product Form Modal ────────────────────────────────────────────────────────

type ProductFormProps = {
  product?: Product | null;
  categories: Category[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
};

function ProductFormModal({ product, categories, token, onClose, onSaved }: ProductFormProps) {
  const editing = !!product;
  const [form, setForm] = useState({
    name:         product?.name ?? "",
    description:  product?.description ?? "",
    price:        product?.price?.toString() ?? "",
    unit:         product?.unit ?? "",
    variants:     product?.variants?.join(", ") ?? "",
    quantity:     product?.quantity?.toString() ?? "",
    deliveryTime: product?.deliveryTime ?? "",
    organic:      product?.organic ?? false,
    categoryId:   product?.category?.id ?? (categories[0]?.id ?? ""),
    status:       product?.status ?? "AVAILABLE",
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [videos, setVideos] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "variants") {
          const list = String(v).split(",").map((s) => s.trim()).filter(Boolean);
          fd.append(k, JSON.stringify(list));
        } else {
          fd.append(k, String(v));
        }
      });
      if (images) Array.from(images).forEach((f) => fd.append("images", f));
      if (videos) Array.from(videos).forEach((f) => fd.append("videos", f));
      const url = editing ? `${API}/producer/products/${product!.id}` : `${API}/producer/products`;
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? "Failed to save"); }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/20 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/70 bg-white/50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Glass Studio</p>
            <h2 className="mt-1 font-bold text-[#173427]">{editing ? "Edit Product" : "Add New Product"}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200/80 bg-white/70 p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.95))]">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200/60 bg-red-50/80 px-3 py-3 text-sm text-red-600 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Product Name *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description *</label>
              <textarea required rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Price (₹) *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Unit *</label>
              <input required placeholder="kg, litre, piece…" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Stock Quantity *</label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Time *</label>
              <input required placeholder="e.g. 2–3 days" value={form.deliveryTime} onChange={(e) => setForm((f) => ({ ...f, deliveryTime: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category *</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/15">
                {["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "UPDATING"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="organic" checked={form.organic} onChange={(e) => setForm((f) => ({ ...f, organic: e.target.checked }))}
                className="w-4 h-4 accent-[#1c3a2a]" />
              <label htmlFor="organic" className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <Leaf className="w-3.5 h-3.5 text-green-600" /> Organic certified
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Images (max 5)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-3 py-3 text-sm text-slate-500 transition-colors hover:border-[#c9a227] hover:text-slate-700">
                <Upload className="w-4 h-4" />
                {images ? `${images.length} file(s)` : "Choose images"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImages(e.target.files)} />
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Videos (max 2)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-3 py-3 text-sm text-slate-500 transition-colors hover:border-[#c9a227] hover:text-slate-700">
                <Upload className="w-4 h-4" />
                {videos ? `${videos.length} file(s)` : "Choose videos"}
                <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => setVideos(e.target.files)} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white/70 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#173427] py-3 text-sm font-semibold text-white shadow-lg shadow-[#173427]/20 transition-colors hover:bg-[#234c38] disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

type Tab = "products" | "orders" | "inventory" | "earnings" | "notifications";

export default function ProducerDashboard() {
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuth();

  const [tab, setTab] = useState<Tab>("products");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProducerOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const authHeader = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  function mapOrder(o: Record<string, unknown>): ProducerOrder {
    const rawItems = (o.items as Record<string, unknown>[]) ?? [];
    const asgn = (o.assignment as Record<string, unknown>) ?? {};
    return {
      id:            o.id as string,
      date:          new Date(o.createdAt as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      subtotal:      (o.subtotal as number) ?? 0,
      status:        o.status as string,
      paymentMethod: o.paymentMethod as string,
      customer:      o.customer as string,
      mobile:        o.mobile as string,
      assignment:    { status: asgn.status as string, expiresAt: (asgn.expiresAt as string) ?? null },
      items: rawItems.map((i) => ({
        name:     (i.name as string) ?? "Item",
        variant:  i.variant as string,
        quantity: i.quantity as number,
        price:    i.price as number,
        subtotal: i.subtotal as number,
      })),
    };
  }

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, notifRes, catRes, invRes, earnRes] = await Promise.all([
        fetch(`${API}/producer/stats`,         { headers: authHeader() }),
        fetch(`${API}/producer/products`,      { headers: authHeader() }),
        fetch(`${API}/producer/orders`,        { headers: authHeader() }),
        fetch(`${API}/producer/notifications`, { headers: authHeader() }),
        fetch(`${API}/products/categories`),
        fetch(`${API}/producer/inventory`,     { headers: authHeader() }),
        fetch(`${API}/producer/earnings`,      { headers: authHeader() }),
      ]);
      const [statsData, productsData, ordersData, notifData, catData, invData, earnData] = await Promise.all([
        statsRes.json(), productsRes.json(), ordersRes.json(), notifRes.json(), catRes.json(),
        invRes.json(), earnRes.json(),
      ]);
      setStats(statsData.data ?? null);
      setProducts(productsData.data ?? []);
      setOrders((ordersData.data ?? []).map(mapOrder));
      setNotifications(notifData.data ?? []);
      setCategories(catData.data ?? []);
      setInventory(invData.data ?? []);
      setEarnings(earnData.data ?? null);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token, authHeader]);

  useEffect(() => {
    if (!isLoggedIn) { router.replace("/auth/login"); return; }
    if (user?.role !== "PRODUCER" && user?.role !== "DC") { router.replace("/"); return; }
    fetchAll();
  }, [isLoggedIn, user, router, fetchAll]);

  async function handleOrderAction(orderId: string, action: "accept" | "decline") {
    setActionLoading(orderId + action);
    try {
      await fetch(`${API}/producer/orders/${orderId}/${action}`, { method: "PATCH", headers: authHeader() });
      fetchAll();
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  }

  async function handleAdvanceOrder(orderId: string) {
    setActionLoading("adv_" + orderId);
    try {
      await fetch(`${API}/producer/orders/${orderId}/advance`, { method: "PATCH", headers: authHeader() });
      fetchAll();
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setActionLoading("del_" + id);
    try {
      await fetch(`${API}/producer/products/${id}`, { method: "DELETE", headers: authHeader() });
      fetchAll();
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  }

  if (!isLoggedIn || (user?.role !== "PRODUCER" && user?.role !== "DC")) return null;

  const urgentCount = notifications.filter((n) => n.urgent).length;

  const tabs: { id: Tab; label: string; icon: typeof Package; badge?: number }[] = [
    { id: "products",      label: "My Products",    icon: Package },
    { id: "orders",        label: "Orders",          icon: ShoppingBag },
    { id: "inventory",     label: "Inventory",       icon: ClipboardList },
    { id: "earnings",      label: "Earnings",        icon: IndianRupee },
    { id: "notifications", label: "Notifications",   icon: Bell, badge: urgentCount },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3ef] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,162,39,0.22),transparent_36%),radial-gradient(circle_at_top_right,rgba(29,78,216,0.14),transparent_28%),linear-gradient(180deg,#f4f8f5_0%,#eef3ef_100%)]" />
      <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[#c9a227]/20 blur-3xl" />
      <div className="absolute right-[-6rem] top-56 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* ── Top header banner ── */}
        <div className="border-b border-white/30 bg-white/60 px-6 py-5 backdrop-blur-2xl sm:px-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#173427,#2f6b49)] text-xl font-bold text-white shadow-lg shadow-emerald-900/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#c9a227]">Producer — {user?.role}</p>
                <h1 className="text-xl font-bold text-[#173427] sm:text-2xl">{user?.businessName ?? user?.name}</h1>
                {user?.businessLocation && (
                  <p className="text-xs text-slate-500">{user.businessLocation}</p>
                )}
              </div>
            </div>

            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Products",  value: stats.totalProducts,                       icon: Layers },
                  { label: "Orders",    value: stats.totalOrders,                         icon: BarChart3 },
                  { label: "Revenue",   value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee },
                  { label: "Stock",     value: stats.totalStock,                          icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-5 py-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.12))]">
                      <Icon className="w-5 h-5 text-[#173427]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                      <p className="text-xl font-bold text-[#173427]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Horizontal tab bar ── */}
        <div className="sticky top-0 z-20 border-b border-white/30 bg-white/70 px-6 backdrop-blur-2xl sm:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors focus:outline-none ${
                  tab === id
                    ? "text-[#173427]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge && badge > 0 ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
                {/* Active underline */}
                {tab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#173427]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content panel ── */}
        <div className="px-6 py-6 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-white/30 bg-white/55 py-20 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
            <div className="flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-5 py-3 text-[#173427] shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">Loading dashboard</span>
            </div>
          </div>
        ) : (
          <>
            {/* ── Products ── */}
            {tab === "products" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Catalog</p>
                    <h2 className="mt-1 font-bold text-[#173427]">My Products</h2>
                  </div>
                  <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
                    className="flex items-center gap-1.5 rounded-2xl bg-[linear-gradient(135deg,#173427,#2f6b49)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-transform hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="rounded-[28px] border border-white/30 bg-white/55 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.12))]">
                      <Package className="w-8 h-8 text-[#173427]" />
                    </div>
                    <p className="font-semibold text-[#173427]">No products yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add your first product to get started</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[28px] border border-white/30 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    {products.map((p) => (
                      <div key={p.id} className="flex gap-4 items-center border-b border-white/40 p-4 last:border-b-0">
                        {p.images[0] ? (
                          <img src={`${MEDIA}${p.images[0]}`} alt={p.name}
                            className="w-16 h-16 object-cover rounded-2xl shrink-0 ring-1 ring-white/60 shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.14))]">
                            <Package className="w-5 h-5 text-[#173427]/45" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#173427] text-sm">{p.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-500"}`}>
                              {p.status.replace(/_/g, " ")}
                            </span>
                            {p.organic && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                                <Leaf className="w-2.5 h-2.5" />Organic
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{p.category.icon} {p.category.label}</p>
                          <p className="text-sm font-bold text-[#173427] mt-0.5">₹{p.price}/{p.unit} · Stock: {p.quantity}</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => { setEditingProduct(p); setShowForm(true); }}
                            className="flex items-center gap-1 text-xs font-semibold text-[#173427] border border-white/60 bg-white/70 px-2.5 py-1.5 rounded-xl hover:bg-white transition-colors shadow-sm">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} disabled={actionLoading === "del_" + p.id}
                            className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200/70 bg-white/70 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 shadow-sm">
                            {actionLoading === "del_" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Orders ── */}
            {tab === "orders" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Orders</p>
                  <h2 className="mt-1 font-bold text-[#173427]">Incoming Orders</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="rounded-[28px] border border-white/30 bg-white/55 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <ShoppingBag className="mx-auto mb-3 w-12 h-12 text-slate-300" />
                    <p className="font-semibold text-[#173427]">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[28px] border border-white/30 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    {orders.map((o) => {
                      const isOpen = expandedOrder === o.id;
                      const isPending = o.assignment.status === "PENDING";
                      return (
                        <div key={o.id} className="border-b border-white/40 last:border-b-0">
                          <button onClick={() => setExpandedOrder(isOpen ? null : o.id)}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/70">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.12))]">
                              <ShoppingBag className="w-5 h-5 text-[#173427]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#173427] text-sm font-mono">{o.id.slice(0, 14)}…</p>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status] ?? "bg-slate-100 text-slate-500"}`}>
                                  {o.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {o.date} · {o.items.length} item{o.items.length !== 1 ? "s" : ""} · ₹{o.subtotal.toLocaleString()}
                              </p>
                            </div>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>

                          {isOpen && (
                            <div className="space-y-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(244,248,245,0.9))] px-5 pb-5">
                              {/* Items */}
                              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Items</p>
                                <div className="space-y-1.5">
                                  {o.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                      <span className="text-slate-700">
                                        {item.name}
                                        {item.variant && <span className="text-slate-400"> ({item.variant})</span>}
                                        {" "}× {item.quantity}
                                      </span>
                                      <span className="font-semibold text-[#173427]">₹{item.subtotal.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Customer info */}
                              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-xs shadow-sm">
                                <p className="mb-1 font-bold text-slate-600">Customer</p>
                                <p className="text-slate-500">{o.customer} · +91 {o.mobile}</p>
                                <p className="mt-1"><span className="font-bold text-slate-600">Payment:</span> <span className="text-slate-500">{o.paymentMethod}</span></p>
                              </div>

                              {/* Accept / Decline */}
                              {isPending && (
                                <div className="flex gap-3">
                                  <button onClick={() => handleOrderAction(o.id, "accept")} disabled={!!actionLoading}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                                    {actionLoading === o.id + "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Accept
                                  </button>
                                  <button onClick={() => handleOrderAction(o.id, "decline")} disabled={!!actionLoading}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50">
                                    {actionLoading === o.id + "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Decline
                                  </button>
                                </div>
                              )}
                              {/* Advance status: Packed → Shipped → Delivered */}
                              {(o.status === "PACKED" || o.status === "OUT_FOR_DELIVERY") && o.assignment.status === "ACCEPTED" && (
                                <button onClick={() => handleAdvanceOrder(o.id)} disabled={!!actionLoading}
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                                  {actionLoading === "adv_" + o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                                  {o.status === "PACKED" ? "Mark as Shipped" : "Mark as Delivered"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Inventory ── */}
            {tab === "inventory" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Stock</p>
                  <h2 className="mt-1 font-bold text-[#173427]">Inventory Summary</h2>
                </div>
                {inventory.length === 0 ? (
                  <div className="rounded-[28px] border border-white/30 bg-white/55 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <ClipboardList className="mx-auto mb-3 w-12 h-12 text-slate-300" />
                    <p className="font-semibold text-[#173427]">No products to show</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[28px] border border-white/30 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/40 bg-white/40">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Product</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Uploaded</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Sold</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Remaining</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Revenue</th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((row) => (
                          <tr key={row.id} className="border-b border-white/30 last:border-0 hover:bg-white/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {row.image ? (
                                  <img src={`${MEDIA}${row.image}`} alt={row.name} className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/60" />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.14))] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#173427]/40" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[#173427] text-xs">{row.name}</p>
                                  <p className="text-[10px] text-slate-400">{row.category.icon} {row.category.label}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700 text-xs">{row.uploadedQty} {row.unit}</td>
                            <td className="px-4 py-3 text-right font-semibold text-rose-600 text-xs">{row.soldQty} {row.unit}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600 text-xs">{row.remainingQty} {row.unit}</td>
                            <td className="px-4 py-3 text-right font-semibold text-[#173427] text-xs">₹{row.revenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                                {row.status.replace(/_/g, " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-white/40 bg-white/30">
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#173427] text-xs">Total</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700 text-xs">{inventory.reduce((s, r) => s + r.uploadedQty, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600 text-xs">{inventory.reduce((s, r) => s + r.soldQty, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 text-xs">{inventory.reduce((s, r) => s + r.remainingQty, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#173427] text-xs">₹{inventory.reduce((s, r) => s + r.revenue, 0).toLocaleString()}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Earnings ── */}
            {tab === "earnings" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Revenue</p>
                  <h2 className="mt-1 font-bold text-[#173427]">Earnings Report</h2>
                </div>

                {/* Summary cards */}
                {earnings && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Revenue", value: `₹${earnings.totalRevenue.toLocaleString()}`, icon: IndianRupee },
                      { label: "Total Units Sold", value: earnings.totalSold, icon: TrendingUp },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-3xl border border-white/45 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(23,52,39,0.12),rgba(201,162,39,0.12))]">
                            <Icon className="w-4 h-4 text-[#173427]" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
                            <p className="mt-0.5 text-lg font-bold text-[#173427]">{value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-product table */}
                {!earnings || earnings.rows.length === 0 ? (
                  <div className="rounded-[28px] border border-white/30 bg-white/55 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <IndianRupee className="mx-auto mb-3 w-12 h-12 text-slate-300" />
                    <p className="font-semibold text-[#173427]">No earnings yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[28px] border border-white/30 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/40 bg-white/40">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Product</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Orders</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Units Sold</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.rows.map((row) => (
                          <tr key={row.id} className="border-b border-white/30 last:border-0 hover:bg-white/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {row.image ? (
                                  <img src={`${MEDIA}${row.image}`} alt={row.name} className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/60" />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.14))] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#173427]/40" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[#173427] text-xs">{row.name}</p>
                                  <p className="text-[10px] text-slate-400">{row.category} · {row.unit}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{row.orderCount}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{row.soldQty} {row.unit}</td>
                            <td className="px-4 py-3 text-right font-bold text-[#173427] text-xs">₹{row.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-white/40 bg-white/30">
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#173427] text-xs">Total</td>
                          <td />
                          <td className="px-4 py-3 text-right font-bold text-slate-700 text-xs">{earnings.totalSold}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#173427] text-xs">₹{earnings.totalRevenue.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Notifications ── */}
            {tab === "notifications" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a227]">Alerts</p>
                  <h2 className="mt-1 font-bold text-[#173427]">Notifications</h2>
                </div>
                {notifications.length === 0 ? (
                  <div className="rounded-[28px] border border-white/30 bg-white/55 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <Bell className="mx-auto mb-3 w-12 h-12 text-slate-300" />
                    <p className="font-semibold text-[#173427]">No notifications</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[28px] border border-white/30 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    {notifications.map((n, i) => {
                      const key =
                        n.type === "order"     ? `order-${n.orderId}`
                        : n.type === "delivered" ? `delivered-${n.id}`
                        : `stock-${n.productId}`;

                      const timeStr = n.type === "order" && n.expiresAt
                        ? `Expires at ${new Date(n.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : n.type === "delivered"
                        ? new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : null;

                      const isDelivered = n.type === "delivered";

                      return (
                        <div key={key ?? i} className={`flex items-start gap-3 border-b border-white/40 px-5 py-4 last:border-b-0 ${
                          isDelivered ? "bg-green-50/60" : n.urgent ? "bg-amber-50/60" : ""
                        }`}>
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isDelivered ? "bg-green-100"
                            : n.urgent   ? "bg-amber-100"
                            : "bg-[linear-gradient(135deg,rgba(23,52,39,0.10),rgba(201,162,39,0.12))]"
                          }`}>
                            {isDelivered
                              ? <CheckCircle className="w-5 h-5 text-green-600" />
                              : <Bell className={`w-5 h-5 ${n.urgent ? "text-amber-700" : "text-[#173427]"}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isDelivered && (
                              <p className="text-xs font-bold text-green-700 mb-0.5">{n.title}</p>
                            )}
                            <p className="text-sm text-slate-700">{n.message}</p>
                            {timeStr && <p className="mt-0.5 text-xs text-slate-400">{timeStr}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

          <div className="h-4" />
        </div>{/* end content panel */}
      </div>{/* end max-w-7xl */}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          token={token!}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
