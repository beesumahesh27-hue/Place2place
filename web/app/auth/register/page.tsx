"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// ── Category definitions ──────────────────────────────────────────────────────

type Category = "customer" | "farmer" | "dairy" | "factory" | "dc";

const CATEGORIES: { id: Category; icon: string; title: string; desc: string; color: string }[] = [
  { id: "customer", icon: "🛒", title: "Customer",          desc: "Buy fresh produce from local farms & factories",   color: "border-[#1c3a2a] bg-[#e8f0eb]" },
  { id: "farmer",   icon: "🌾", title: "Farmer",            desc: "Sell your crops & farm produce directly",           color: "border-green-500 bg-green-50" },
  { id: "dairy",    icon: "🥛", title: "Dairy Farm",        desc: "List milk, curd, ghee from your cattle farm",       color: "border-blue-400 bg-blue-50" },
  { id: "factory",  icon: "🏭", title: "Industry / Factory",desc: "Register your mill, processing unit or factory",    color: "border-[#c9a227] bg-[#fdf8ec]" },
  { id: "dc",       icon: "🚚", title: "Delivery Center",   desc: "Pick up and deliver orders across your area",       color: "border-purple-400 bg-purple-50" },
];

const FACTORY_TYPES = ["Spice Mill", "Rice Mill", "Oil Mill", "Snacks", "Pickles", "Dry Fruits", "Other"];

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide";
const Err = ({ msg }: { msg?: string }) => msg ? <p className="text-red-500 text-[11px] mt-1">⚠ {msg}</p> : null;

// ── Form state shape ──────────────────────────────────────────────────────────

type FormData = {
  firstName: string; surname: string; mobile: string; email: string;
  // Business / location
  businessName: string; businessLocation: string;
  // Farmer
  village: string; crops: string; acres: string; organic: boolean; farmSince: string;
  // Dairy
  cattleBreed: string; cowsCount: string; fssaiCertified: boolean; productsMade: string; established: string;
  // Factory
  factoryType: string; factoryProducts: string; skuCount: string; factoryEstablished: string;
  // DC
  coverageAreas: string; operatingHours: string; riderCount: string;
};

const EMPTY: FormData = {
  firstName: "", surname: "", mobile: "", email: "",
  businessName: "", businessLocation: "",
  village: "", crops: "", acres: "", organic: false, farmSince: "",
  cattleBreed: "", cowsCount: "", fssaiCertified: false, productsMade: "", established: "",
  factoryType: "Spice Mill", factoryProducts: "", skuCount: "", factoryEstablished: "",
  coverageAreas: "", operatingHours: "", riderCount: "",
};

export default function RegisterPage() {
  const router   = useRouter();
  const { login } = useAuth();

  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [form,     setForm]     = useState<FormData>(EMPTY);
  const [otp,      setOtp]      = useState("");
  const [devOtp,   setDevOtp]   = useState("");
  const [errors,   setErrors]   = useState<Partial<Record<keyof FormData | "otp", string>>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (k: keyof FormData, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.surname.trim())   e.surname   = "Required";
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";

    if (category === "farmer") {
      if (!form.crops.trim())    e.crops    = "Required";
      if (!form.farmSince.trim() || isNaN(Number(form.farmSince))) e.farmSince = "Enter a valid year";
    }
    if (category === "dairy") {
      if (!form.businessName.trim())     e.businessName   = "Required";
      if (!form.businessLocation.trim()) e.businessLocation = "Required";
      if (!form.productsMade.trim())     e.productsMade   = "Required";
      if (!form.established.trim() || isNaN(Number(form.established))) e.established = "Enter a valid year";
    }
    if (category === "factory") {
      if (!form.businessName.trim())     e.businessName      = "Required";
      if (!form.businessLocation.trim()) e.businessLocation  = "Required";
      if (!form.factoryProducts.trim())  e.factoryProducts   = "Required";
      if (!form.factoryEstablished.trim() || isNaN(Number(form.factoryEstablished))) e.factoryEstablished = "Enter a valid year";
    }
    if (category === "dc") {
      if (!form.businessName.trim())     e.businessName     = "Required";
      if (!form.businessLocation.trim()) e.businessLocation = "Required";
      if (!form.coverageAreas.trim())    e.coverageAreas    = "Required";
      if (!form.operatingHours.trim())   e.operatingHours   = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────

  async function handleSendOtp() {
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const res  = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to send OTP");
      if (data.data?.otp) setDevOtp(data.data.otp);
      setStep(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Verify OTP + save profile ─────────────────────────────────────────────

  async function handleVerifyOtp() {
    if (otp.length < 4) { setErrors({ otp: "Enter the OTP" }); return; }
    setLoading(true); setApiError("");
    try {
      // Step 1: verify OTP → get token
      const verifyRes  = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.mobile, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message ?? "OTP verification failed");

      const token = verifyData.data.token;
      if (!token) throw new Error("Authentication failed — please try again");

      // Step 2: save profile data
      const roleMap: Record<Category, "CUSTOMER" | "PRODUCER" | "DC"> = {
        customer: "CUSTOMER", farmer: "PRODUCER", dairy: "PRODUCER", factory: "PRODUCER", dc: "DC",
      };

      const profileBody: Record<string, unknown> = {
        name:  `${form.firstName.trim()} ${form.surname.trim()}`,
        role:  roleMap[category!],
        email: form.email || undefined,
      };

      if (category === "farmer") {
        profileBody.producerSubType = "farmer";
        profileBody.crops           = form.crops;
        profileBody.acres           = parseFloat(form.acres) || 0;
        profileBody.organic         = form.organic;
        profileBody.farmSince       = parseInt(form.farmSince);
        profileBody.village         = form.village || undefined;
      }
      if (category === "dairy") {
        profileBody.producerSubType = "factory";
        profileBody.businessName    = form.businessName;
        profileBody.businessLocation = form.businessLocation;
        profileBody.factoryType     = "Dairy";
        profileBody.productsMade    = form.productsMade;
        profileBody.established     = parseInt(form.established);
        profileBody.cattleBreed     = form.cattleBreed || undefined;
        profileBody.cowsCount       = parseInt(form.cowsCount) || undefined;
        profileBody.fssaiCertified  = form.fssaiCertified;
        profileBody.skuCount        = 0;
      }
      if (category === "factory") {
        profileBody.producerSubType  = "factory";
        profileBody.businessName     = form.businessName;
        profileBody.businessLocation = form.businessLocation;
        profileBody.factoryType      = form.factoryType;
        profileBody.productsMade     = form.factoryProducts;
        profileBody.skuCount         = parseInt(form.skuCount) || 0;
        profileBody.established      = parseInt(form.factoryEstablished);
      }
      if (category === "dc") {
        profileBody.businessName     = form.businessName;
        profileBody.businessLocation = form.businessLocation;
        profileBody.coverageAreas    = form.coverageAreas;
        profileBody.operatingHours   = form.operatingHours;
        profileBody.riderCount       = parseInt(form.riderCount) || 0;
        profileBody.capacity         = "0/day";
      }

      const profRes  = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileBody),
      });
      const profData = await profRes.json();
      if (!profRes.ok) throw new Error(profData.message ?? "Profile save failed");

      // Log in with the final user + token
      const finalToken = profData.data.token ?? token;
      const finalUser  = profData.data.user  ?? verifyData.data.user;
      login(finalUser, finalToken);

      const role = finalUser?.role;
      if (role === "PRODUCER" || role === "DC") router.push("/producer");
      else router.push("/");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stepLabel = step === 1 ? "Who are you?" : step === 2 ? "Your details" : "Verify mobile";
  const roleLabel = CATEGORIES.find((c) => c.id === category)?.title ?? "";

  return (
    <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#1c3a2a] rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">P2P</div>
          <h1 className="text-2xl font-bold text-[#1c3a2a]">Join Place2Place</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "Choose your role to get started"
             : step === 2 ? `Registering as ${roleLabel}`
             : `OTP sent to +91 ${form.mobile}`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-[#1c3a2a]" : "bg-gray-200"}`} />
          ))}
        </div>

        {apiError && (
          <p className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">⚠ {apiError}</p>
        )}

        {/* ── Step 1: Category selection ───────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 text-left transition-all ${category === cat.id ? cat.color : "border-gray-100 hover:border-gray-200"}`}>
                <span className="text-2xl shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1c3a2a] text-sm">{cat.title}</p>
                  <p className="text-gray-500 text-xs">{cat.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${category === cat.id ? "border-[#1c3a2a] bg-[#1c3a2a]" : "border-gray-300"}`}>
                  {category === cat.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
            {!category && <p className="text-amber-600 text-xs text-center pt-1">Select a category to continue</p>}
            <button onClick={() => { if (category) setStep(2); }} disabled={!category}
              className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl mt-3 hover:bg-[#2d5a3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Profile details ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">

            {/* Common: name + mobile */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name *</label>
                <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Ravi" className={inputCls} />
                <Err msg={errors.firstName} />
              </div>
              <div>
                <label className={labelCls}>Surname *</label>
                <input value={form.surname} onChange={(e) => set("surname", e.target.value)} placeholder="Kumar" className={inputCls} />
                <Err msg={errors.surname} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Mobile Number *</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">+91</span>
                <input type="tel" value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210" maxLength={10} className={`${inputCls} flex-1`} />
              </div>
              <Err msg={errors.mobile} />
            </div>

            <div>
              <label className={labelCls}>Email <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com" className={inputCls} />
              <Err msg={errors.email} />
            </div>

            {/* ── Farmer fields ── */}
            {category === "farmer" && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest">Farm Details</p>
                <div>
                  <label className={labelCls}>Village / Location</label>
                  <input value={form.village} onChange={(e) => set("village", e.target.value)}
                    placeholder="Jadcherla, Telangana" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Crops / Produce *</label>
                  <input value={form.crops} onChange={(e) => set("crops", e.target.value)}
                    placeholder="Turmeric, Chilies, Rice" className={inputCls} />
                  <Err msg={errors.crops} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Farm Size (acres)</label>
                    <input type="number" min="0" step="0.5" value={form.acres}
                      onChange={(e) => set("acres", e.target.value)} placeholder="4" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Farming Since *</label>
                    <input type="number" min="1970" max="2025" value={form.farmSince}
                      onChange={(e) => set("farmSince", e.target.value)} placeholder="2019" className={inputCls} />
                    <Err msg={errors.farmSince} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.organic} onChange={(e) => set("organic", e.target.checked)}
                    className="w-4 h-4 accent-[#1c3a2a]" />
                  <span className="text-sm text-gray-700 font-medium">Certified Organic Farm</span>
                </label>
              </div>
            )}

            {/* ── Dairy fields ── */}
            {category === "dairy" && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest">Dairy Farm Details</p>
                <div>
                  <label className={labelCls}>Farm / Business Name *</label>
                  <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Sri Gir Dairy Farm" className={inputCls} />
                  <Err msg={errors.businessName} />
                </div>
                <div>
                  <label className={labelCls}>Location *</label>
                  <input value={form.businessLocation} onChange={(e) => set("businessLocation", e.target.value)}
                    placeholder="Nizamabad, Telangana" className={inputCls} />
                  <Err msg={errors.businessLocation} />
                </div>
                <div>
                  <label className={labelCls}>Products (milk, curd, ghee…) *</label>
                  <input value={form.productsMade} onChange={(e) => set("productsMade", e.target.value)}
                    placeholder="A2 Milk, Curd, Butter" className={inputCls} />
                  <Err msg={errors.productsMade} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Cattle Breed</label>
                    <input value={form.cattleBreed} onChange={(e) => set("cattleBreed", e.target.value)}
                      placeholder="Gir / Ongole / HF" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Number of Cows</label>
                    <input type="number" min="0" value={form.cowsCount}
                      onChange={(e) => set("cowsCount", e.target.value)} placeholder="12" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Established Year *</label>
                  <input type="number" min="1970" max="2025" value={form.established}
                    onChange={(e) => set("established", e.target.value)} placeholder="2018" className={inputCls} />
                  <Err msg={errors.established} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.fssaiCertified} onChange={(e) => set("fssaiCertified", e.target.checked)}
                    className="w-4 h-4 accent-[#1c3a2a]" />
                  <span className="text-sm text-gray-700 font-medium">FSSAI Certified</span>
                </label>
              </div>
            )}

            {/* ── Factory / Industry fields ── */}
            {category === "factory" && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest">Factory Details</p>
                <div>
                  <label className={labelCls}>Business / Factory Name *</label>
                  <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Sri Krishna Rice Mill" className={inputCls} />
                  <Err msg={errors.businessName} />
                </div>
                <div>
                  <label className={labelCls}>Location *</label>
                  <input value={form.businessLocation} onChange={(e) => set("businessLocation", e.target.value)}
                    placeholder="Warangal, Telangana" className={inputCls} />
                  <Err msg={errors.businessLocation} />
                </div>
                <div>
                  <label className={labelCls}>Factory Type *</label>
                  <select value={form.factoryType} onChange={(e) => set("factoryType", e.target.value)} className={inputCls}>
                    {FACTORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Products Made *</label>
                  <input value={form.factoryProducts} onChange={(e) => set("factoryProducts", e.target.value)}
                    placeholder="Raw Rice, Boiled Rice, Bran" className={inputCls} />
                  <Err msg={errors.factoryProducts} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>No. of SKUs</label>
                    <input type="number" min="0" value={form.skuCount}
                      onChange={(e) => set("skuCount", e.target.value)} placeholder="5" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Established Year *</label>
                    <input type="number" min="1900" max="2025" value={form.factoryEstablished}
                      onChange={(e) => set("factoryEstablished", e.target.value)} placeholder="2010" className={inputCls} />
                    <Err msg={errors.factoryEstablished} />
                  </div>
                </div>
              </div>
            )}

            {/* ── DC fields ── */}
            {category === "dc" && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest">Delivery Center Details</p>
                <div>
                  <label className={labelCls}>Center Name *</label>
                  <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Fast Delivery Co." className={inputCls} />
                  <Err msg={errors.businessName} />
                </div>
                <div>
                  <label className={labelCls}>Location *</label>
                  <input value={form.businessLocation} onChange={(e) => set("businessLocation", e.target.value)}
                    placeholder="Hyderabad, Telangana" className={inputCls} />
                  <Err msg={errors.businessLocation} />
                </div>
                <div>
                  <label className={labelCls}>Coverage Areas *</label>
                  <input value={form.coverageAreas} onChange={(e) => set("coverageAreas", e.target.value)}
                    placeholder="Kukatpally, Miyapur, Bachupally" className={inputCls} />
                  <Err msg={errors.coverageAreas} />
                </div>
                <div>
                  <label className={labelCls}>Operating Hours *</label>
                  <input value={form.operatingHours} onChange={(e) => set("operatingHours", e.target.value)}
                    placeholder="6:00 AM – 9:00 PM" className={inputCls} />
                  <Err msg={errors.operatingHours} />
                </div>
                <div>
                  <label className={labelCls}>Number of Riders</label>
                  <input type="number" min="0" value={form.riderCount}
                    onChange={(e) => set("riderCount", e.target.value)} placeholder="8" className={inputCls} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50">
                ← Back
              </button>
              <button type="button" onClick={handleSendOtp} disabled={loading}
                className="flex-1 bg-[#1c3a2a] text-white font-bold py-3 rounded-xl hover:bg-[#2d5a3d] transition-colors text-sm disabled:opacity-60">
                {loading ? "Sending OTP…" : "Send OTP →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: OTP verification ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
                Dev mode — OTP: <span className="font-bold tracking-widest">{devOtp}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Enter 6-digit OTP</label>
              <input type="tel" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="——————" maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-2xl font-bold tracking-[1rem] text-center outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
              <Err msg={errors.otp} />
            </div>

            <button type="button" onClick={handleVerifyOtp} disabled={loading}
              className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60">
              {loading ? "Creating account…" : "Verify & Create Account"}
            </button>

            <button type="button" onClick={() => { setStep(2); setOtp(""); setDevOtp(""); setApiError(""); }}
              className="w-full text-sm text-gray-500 hover:text-[#1c3a2a] transition-colors">
              ← Change details
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#1c3a2a] font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
