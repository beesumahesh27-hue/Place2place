"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Lock, Check, Loader2 } from "lucide-react";

const UPI_APPS = [
  { id: "phonepe",    label: "PhonePe" },
  { id: "gpay",       label: "Google Pay" },
  { id: "amazon",     label: "Amazon Pay" },
  { id: "supermoney", label: "SuperMoney" },
  { id: "other",      label: "Other UPI" },
];

const BANKS = [
  "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "Punjab National Bank",
];

const STEPS = ["Cart", "Address", "Payment", "Done"];

export default function PaymentPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { addOrder, isLoggedIn, token } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

  const [method, setMethod] = useState<"upi" | "card" | "netbanking" | null>(null);
  const [upiApp, setUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [bank, setBank] = useState("");
  const [processing, setProcessing] = useState(false);

  const delivery = 49;
  const grand = totalPrice + delivery;

  function fmtCard(k: keyof typeof card, val: string) {
    if (k === "number")  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    if (k === "expiry")  return val.replace(/\D/g, "").slice(0, 4).replace(/^(.{2})(.+)/, "$1/$2");
    if (k === "cvv")     return val.replace(/\D/g, "").slice(0, 3);
    return val;
  }

  const handlePay = async () => {
    if (method === "upi" && !upiApp && !upiId.trim()) return alert("Select a UPI app or enter your UPI ID");
    if (method === "card" && (!card.number || !card.expiry || !card.cvv || !card.name)) return alert("Fill all card details");
    if (method === "netbanking" && !bank) return alert("Select your bank");

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));

    const address   = sessionStorage.getItem("deliveryAddress") || "Address not provided";
    const payLabel  = method === "upi"        ? `UPI – ${upiApp || upiId}`
                    : method === "card"        ? "Debit / Credit Card"
                    : `Net Banking – ${bank}`;
    let orderId = "ORD" + Math.random().toString(36).slice(2, 8).toUpperCase();

    if (isLoggedIn && token) {
      try {
        const res = await fetch(`${API}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.product.id,
              variant:   i.variant || "Standard",
              quantity:  i.quantity,
              price:     i.product.price,
            })),
            total:         grand,
            paymentMethod: payLabel,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setProcessing(false);
          alert(`Order failed: ${data.message ?? "Server error"}. Please try again.`);
          return;
        }
        if (data.data?.id) orderId = data.data.id;
      } catch { /* silent */ }
    }

    if (isLoggedIn) {
      addOrder({
        id:            orderId,
        date:          new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        items:         items.map((i) => ({ name: i.product.name, variant: i.variant, qty: i.quantity, price: i.product.price })),
        total:         grand,
        address,
        status:        "confirmed",
        paymentMethod: payLabel,
      });
    }
    sessionStorage.setItem("lastOrderId", orderId);
    sessionStorage.setItem("lastOrderTotal", String(grand));
    clearCart();
    router.push("/checkout/success");
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB]">

      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done    = i < 2;
            const current = i === 2;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done    ? "bg-[#1c3a2a] text-white"
                    : current ? "bg-[#c9a227] text-[#1c3a2a]"
                    : "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${current ? "text-[#1c3a2a]" : done ? "text-[#1c3a2a]" : "text-gray-400"}`}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${done ? "bg-[#1c3a2a]" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main split ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_340px] min-h-[calc(100vh-65px)]">

        {/* LEFT — payment selection */}
        <div className="px-6 py-10 lg:px-12 lg:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a227] mb-2">Step 3 of 4</p>
          <h1 className="text-2xl font-bold text-[#1a2e22] mb-8">Choose payment method</h1>

          <div className="space-y-3">

            {/* ── UPI ── */}
            <div
              className={`rounded-2xl border-2 bg-white transition-all overflow-hidden ${
                method === "upi" ? "border-[#1c3a2a]" : "border-transparent shadow-sm hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => setMethod("upi")}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${method === "upi" ? "bg-[#1c3a2a]" : "bg-[#F5F1EB]"}`}>
                  <svg className={`w-5 h-5 ${method === "upi" ? "text-white" : "text-[#1c3a2a]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1a2e22] text-sm">UPI</p>
                  <p className="text-xs text-gray-400 mt-0.5">PhonePe · Google Pay · Amazon Pay</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${method === "upi" ? "border-[#1c3a2a] bg-[#1c3a2a]" : "border-gray-300"}`}>
                  {method === "upi" && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>

              {method === "upi" && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
                  <div className="flex flex-wrap gap-2 pt-4">
                    {UPI_APPS.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => { setUpiApp(app.id); setUpiId(""); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          upiApp === app.id
                            ? "border-[#1c3a2a] bg-[#1c3a2a] text-white"
                            : "border-gray-100 bg-[#F5F1EB] text-[#1a2e22] hover:border-gray-300"
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-gray-400 shrink-0">or enter UPI ID</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <input
                    value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setUpiApp(null); }}
                    placeholder="yourname@upi"
                    className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm text-[#1a2e22] border border-transparent focus:border-[#1c3a2a] focus:outline-none placeholder:text-gray-400"
                  />
                </div>
              )}
            </div>

            {/* ── Card ── */}
            <div
              className={`rounded-2xl border-2 bg-white transition-all overflow-hidden ${
                method === "card" ? "border-[#1c3a2a]" : "border-transparent shadow-sm hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => setMethod("card")}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${method === "card" ? "bg-[#1c3a2a]" : "bg-[#F5F1EB]"}`}>
                  <svg className={`w-5 h-5 ${method === "card" ? "text-white" : "text-[#1c3a2a]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1a2e22] text-sm">Debit / Credit Card</p>
                  <p className="text-xs text-gray-400 mt-0.5">Visa · Mastercard · RuPay</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${method === "card" ? "border-[#1c3a2a] bg-[#1c3a2a]" : "border-gray-300"}`}>
                  {method === "card" && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>

              {method === "card" && (
                <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">
                  {/* Visual card */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#1c3a2a] to-[#2d5a3d] p-5 text-white mb-4">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-7 rounded bg-[#c9a227]/80" />
                      <span className="text-[10px] font-bold tracking-widest opacity-60">PLACE2PLACE</span>
                    </div>
                    <p className="font-mono text-base tracking-[0.2em] mb-4 min-h-[1.5rem] text-white/90">
                      {card.number || "•••• •••• •••• ••••"}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Cardholder</p>
                        <p className="text-xs font-bold uppercase tracking-wide">{card.name || "YOUR NAME"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Expires</p>
                        <p className="text-xs font-bold">{card.expiry || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Card Number</label>
                    <input
                      value={card.number}
                      onChange={(e) => setCard((c) => ({ ...c, number: fmtCard("number", e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-[#1a2e22] border border-transparent focus:border-[#1c3a2a] focus:outline-none placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name on Card</label>
                    <input
                      value={card.name}
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value.toUpperCase() }))}
                      placeholder="RAVI KUMAR"
                      className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm uppercase tracking-widest text-[#1a2e22] border border-transparent focus:border-[#1c3a2a] focus:outline-none placeholder:text-gray-300 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Expiry</label>
                      <input
                        value={card.expiry}
                        onChange={(e) => setCard((c) => ({ ...c, expiry: fmtCard("expiry", e.target.value) }))}
                        placeholder="MM/YY"
                        className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm text-[#1a2e22] border border-transparent focus:border-[#1c3a2a] focus:outline-none placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">CVV</label>
                      <input
                        value={card.cvv}
                        onChange={(e) => setCard((c) => ({ ...c, cvv: fmtCard("cvv", e.target.value) }))}
                        placeholder="•••"
                        type="password"
                        className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm text-[#1a2e22] border border-transparent focus:border-[#1c3a2a] focus:outline-none placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    You'll be redirected to your bank for OTP verification
                  </p>
                </div>
              )}
            </div>

            {/* ── Net Banking ── */}
            <div
              className={`rounded-2xl border-2 bg-white transition-all overflow-hidden ${
                method === "netbanking" ? "border-[#1c3a2a]" : "border-transparent shadow-sm hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => setMethod("netbanking")}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${method === "netbanking" ? "bg-[#1c3a2a]" : "bg-[#F5F1EB]"}`}>
                  <svg className={`w-5 h-5 ${method === "netbanking" ? "text-white" : "text-[#1c3a2a]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="6"/><path d="M3 10h18"/><path d="M5 6h14l1 4H4l1-4z"/>
                    <rect x="3" y="14" width="3" height="6"/><rect x="10.5" y="14" width="3" height="6"/><rect x="18" y="14" width="3" height="6"/>
                    <path d="M3 20h18"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1a2e22] text-sm">Internet Banking</p>
                  <p className="text-xs text-gray-400 mt-0.5">SBI · HDFC · ICICI & more</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${method === "netbanking" ? "border-[#1c3a2a] bg-[#1c3a2a]" : "border-gray-300"}`}>
                  {method === "netbanking" && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>

              {method === "netbanking" && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBank(b)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left border-2 transition-all ${
                          bank === b
                            ? "border-[#1c3a2a] bg-[#1c3a2a] text-white"
                            : "border-gray-100 bg-[#F5F1EB] text-[#1a2e22] hover:border-gray-300"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — dark green order panel */}
        <div className="bg-[#1c3a2a] text-white px-8 py-14 flex flex-col lg:sticky lg:top-0 lg:h-screen">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9a227] mb-6">Your order</p>

          {/* Items */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-white/40">Your cart is empty</p>
            ) : items.map((i) => (
              <div key={`${i.product.id}-${i.variant}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight truncate">{i.product.name}</p>
                  {i.variant && <p className="text-xs text-white/40 mt-0.5">{i.variant}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">₹{(i.product.price * i.quantity).toLocaleString()}</p>
                  <p className="text-xs text-white/40">× {i.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-white/10 pt-5 space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>Items</span>
              <span>₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Delivery</span>
              <span>₹{delivery}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-lg pt-3 border-t border-white/10">
              <span>Total</span>
              <span>₹{grand.toLocaleString()}</span>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={!method || processing}
            className="mt-6 w-full bg-[#c9a227] text-[#1c3a2a] font-bold py-4 rounded-xl text-base hover:bg-[#b8911f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><Lock className="w-4 h-4" /> Pay ₹{grand.toLocaleString()}</>
            )}
          </button>

          {!method && (
            <p className="text-center text-xs text-white/30 mt-3">Select a payment method to continue</p>
          )}

          <p className="text-center text-white/30 text-xs mt-4 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            256-bit SSL · Secured by RazorPay
          </p>
        </div>
      </div>
    </div>
  );
}
