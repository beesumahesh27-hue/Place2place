"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Step = "mobile" | "otp" | "profile";

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />;
}

const roles = [
  { id: "CUSTOMER", icon: "🛒", title: "Customer",          desc: "Buy fresh products" },
  { id: "PRODUCER", icon: "🏭", title: "Factory / Producer", desc: "Sell your products" },
  { id: "FARMER",   icon: "🌾", title: "Farmer",             desc: "Sell farm produce directly" },
  { id: "DC",       icon: "🚚", title: "Delivery Center",    desc: "Manage deliveries" },
] as const;

type Role = "CUSTOMER" | "PRODUCER" | "FARMER" | "DC";

const FACTORY_UNITS: Record<string, string> = {
  "Rice Mill":   "kg",
  "Oil Mill":    "L",
  "Spice Mill":  "kg",
  "Dairy":       "L",
  "Snacks":      "kg",
  "Pickles":     "kg",
  "Dry Fruits":  "kg",
  "Other":       "units",
};

const FARM_TYPES = ["Rice Farm", "Vegetable Farm", "Fruit Farm", "Dairy Farm", "Poultry Farm", "Spice Farm", "Other"];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep]             = useState<Step>("mobile");
  const [email, setEmail]           = useState("");
  const [otpValues, setOtpValues]   = useState(["", "", "", "", "", ""]);
  const [tempToken, setTempToken]   = useState("");
  const [devOtp, setDevOtp]         = useState("");

  // Profile fields (new users only)
  const [name, setName]                   = useState("");
  const [role, setRole]                   = useState<Role>("CUSTOMER");
  const [businessName, setBusinessName]   = useState("");
  const [businessLocation, setBusinessLocation] = useState("");

  // Producer-only factory fields
  const [factoryType, setFactoryType]     = useState("Spice Mill");
  const [productsMade, setProductsMade]   = useState("");
  const [skuCount, setSkuCount]           = useState("");
  const [established, setEstablished]     = useState("");

  // Farmer-only fields
  const [farmType, setFarmType]           = useState("Rice Farm");
  const [mainCrops, setMainCrops]         = useState("");
  const [farmSize, setFarmSize]           = useState("");

  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const otp = otpValues.join("");
  const needsBusiness = role === "PRODUCER" || role === "FARMER" || role === "DC";
  const skuUnit = FACTORY_UNITS[factoryType] ?? "units";

  async function post(path: string, body: object, token?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function patch(path: string, body: object, token: string) {
    const res = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  // Step 1 → send OTP
  async function handleSendOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }
    setError(""); setLoading(true); setDevOtp(""); setOtpValues(["", "", "", "", "", ""]);
    const { ok, data } = await post("/auth/send-otp", { contact: email, type: "email" }).catch(() => ({ ok: false, data: { message: "Network error" } }));
    setLoading(false);
    if (!ok) { setError(data.message ?? "Failed to send OTP"); return; }
    if (data.data?.devOtp) setDevOtp(data.data.devOtp);
    setStep("otp");
  }

  // Step 2 → verify OTP
  async function handleVerifyOtp() {
    if (otp.length < 6) { setError("Enter the full 6-digit OTP"); return; }
    setError(""); setLoading(true);
    const { ok, data } = await post("/auth/verify-otp", { contact: email, otp }).catch(() => ({ ok: false, data: { message: "Network error" } }));
    setLoading(false);
    if (!ok) { setError(data.message ?? "Verification failed"); return; }

    if (!data.data?.isNewUser) {
      // Existing user → log in and redirect
      login(data.data.user, data.data.token);
      redirectByRole(data.data.user.role);
    } else {
      // New user → store temp token, go to profile
      setTempToken(data.data.tempToken);
      setStep("profile");
    }
  }

  // Step 3 → complete profile
  async function handleCompleteProfile() {
    if (!name.trim()) { setError("Full name is required"); return; }
    if (needsBusiness && !businessName.trim()) { setError("Business / farm name is required"); return; }
    if (needsBusiness && !businessLocation.trim()) { setError("Location is required"); return; }
    if (role === "PRODUCER") {
      if (!productsMade.trim()) { setError("Products made is required"); return; }
      if (!established || isNaN(Number(established))) { setError("Year established is required"); return; }
    }
    if (role === "FARMER") {
      if (!mainCrops.trim()) { setError("Main crops / produce is required"); return; }
    }
    setError(""); setLoading(true);

    // FARMER registers as PRODUCER in the backend
    const backendRole = role === "FARMER" ? "PRODUCER" : role;
    const body: Record<string, string | number> = { name: name.trim(), role: backendRole };
    if (needsBusiness) { body.businessName = businessName.trim(); body.businessLocation = businessLocation.trim(); }
    if (role === "PRODUCER") {
      body.factoryType  = factoryType;
      body.productsMade = productsMade.trim();
      body.skuCount     = Number(skuCount) || 0;
      body.established  = Number(established);
    }
    if (role === "FARMER") {
      body.producerSubType = "farmer";
      body.crops           = mainCrops.trim();
      body.acres           = Number(farmSize) || 0;
      body.farmSince       = Number(established) || new Date().getFullYear();
      body.village         = businessLocation.trim();
    }

    const { ok, data } = await patch("/auth/profile", body, tempToken).catch(() => ({ ok: false, data: { message: "Network error" } }));
    setLoading(false);
    if (!ok) { setError(data.message ?? "Failed to save profile"); return; }
    login(data.data.user, data.data.token);
    redirectByRole(data.data.user.role);
  }

  function redirectByRole(r: string) {
    if (r === "PRODUCER" || r === "DC") router.push("/producer");
    else router.push("/");
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpValues]; next[idx] = val;
    setOtpValues(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  }
  function handleOtpKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpValues[idx] && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  }

  const stepTitles: Record<Step, string> = { mobile: "Welcome back", otp: "Verify OTP", profile: "Create your account" };
  const stepSubs: Record<Step, string>   = { mobile: "Sign in or register with OTP", otp: `Code sent to ${email}`, profile: "Tell us about yourself" };

  return (
    <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#1c3a2a] rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">P2P</div>
          <h1 className="text-2xl font-bold text-[#1c3a2a]">{stepTitles[step]}</h1>
          <p className="text-gray-500 text-sm mt-1">{stepSubs[step]}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-7 px-12">
          {(["mobile", "otp", "profile"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all ${
                step === s ? "bg-[#1c3a2a] border-[#1c3a2a] text-white"
                  : (["mobile","otp","profile"].indexOf(step) > i) ? "bg-green-500 border-green-500 text-white"
                  : "bg-white border-gray-200 text-gray-400"
              }`}>
                {(["mobile","otp","profile"].indexOf(step) > i) ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 ${(["mobile","otp","profile"].indexOf(step) > i) ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && <p className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-2.5 mb-4 text-center">⚠ {error}</p>}

        {/* STEP 1 — Email */}
        {step === "mobile" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="flex">
                <span className="border border-r-0 border-gray-200 rounded-l-xl px-3 flex items-center text-sm text-gray-500 bg-[#f8f4ed]">
                  <Mail className="w-4 h-4" />
                </span>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder="you@example.com"
                  className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
              </div>
            </div>
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Spinner />}{loading ? "Sending OTP…" : "Send OTP →"}
            </button>
            <p className="text-center text-xs text-gray-400">New user? An account will be created automatically.</p>
          </div>
        )}

        {/* STEP 2 — OTP */}
        {step === "otp" && (
          <div className="space-y-5">
            {devOtp && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-lg">🛠️</span>
                <div><p className="text-xs font-bold text-amber-700">Dev mode — OTP:</p><p className="font-bold tracking-widest text-amber-700">{devOtp}</p></div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
              <div className="flex gap-2 justify-center">
                {otpValues.map((v, i) => (
                  <input key={i} id={`otp-${i}`} maxLength={1} value={v}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    className="w-11 h-12 border-2 rounded-xl text-center text-lg font-bold outline-none focus:border-[#1c3a2a] bg-[#f8f4ed] transition-colors" />
                ))}
              </div>
            </div>
            <button onClick={handleVerifyOtp} disabled={loading}
              className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Spinner />}{loading ? "Verifying…" : "Verify OTP →"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => { setStep("mobile"); setOtpValues(["","","","","",""]); setError(""); setDevOtp(""); }}
                className="text-gray-500 hover:text-[#1c3a2a]">← Change email</button>
              <button onClick={handleSendOtp} disabled={loading} className="text-[#1c3a2a] font-semibold hover:underline disabled:opacity-50">Resend OTP</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Profile (new users only) */}
        {step === "profile" && (
          <div className="space-y-4">
            <p className="text-xs text-center bg-green-50 py-2 rounded-xl text-green-700 font-semibold">✓ {email} verified</p>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">I am a… *</label>
              <div className="space-y-2">
                {roles.map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${role === r.id ? "border-[#1c3a2a] bg-[#e8f0eb]" : "border-gray-100 hover:border-gray-200"}`}>
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-[#1c3a2a] text-sm">{r.title}</p>
                      <p className="text-gray-500 text-xs">{r.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${role === r.id ? "border-[#1c3a2a] bg-[#1c3a2a]" : "border-gray-300"}`}>
                      {role === r.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Business fields (Producer / DC only) */}
            {needsBusiness && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Factory Name *</label>
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={role === "PRODUCER" ? "e.g. Sri Krishna Rice Mill" : "Enter your business"}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Factory Location *</label>
                  <input value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)}
                    placeholder="Enter your Location"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                </div>
              </>
            )}

            {/* Factory / Industry fields (Producer only) */}
            {role === "PRODUCER" && (
              <>
                <div className="pt-1 pb-0.5">
                  <p className="text-xs font-semibold text-[#1c3a2a] border-t border-gray-100 pt-3">Factory / Industry Details</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Factory Type *</label>
                  <select value={factoryType} onChange={(e) => setFactoryType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]">
                    {Object.keys(FACTORY_UNITS).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Products Made *</label>
                  <input value={productsMade} onChange={(e) => setProductsMade(e.target.value)}
                    placeholder="e.g. Turmeric Powder, Red Chilli Powder"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      No. of SKUs <span className="text-[#c9a227] font-bold">({skuUnit})</span>
                    </label>
                    <input type="number" min="0" value={skuCount} onChange={(e) => setSkuCount(e.target.value)}
                      placeholder={`e.g. 500 ${skuUnit}`}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year Established *</label>
                    <input type="number" min="1900" max={new Date().getFullYear()} value={established} onChange={(e) => setEstablished(e.target.value)}
                      placeholder="e.g. 2021"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                  </div>
                </div>
              </>
            )}

            {/* Farmer fields */}
            {role === "FARMER" && (
              <>
                <div className="pt-1 pb-0.5">
                  <p className="text-xs font-semibold text-[#1c3a2a] border-t border-gray-100 pt-3">Farm Details</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Farm Type *</label>
                  <select value={farmType} onChange={(e) => setFarmType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]">
                    {FARM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Main Crops / Produce *</label>
                  <input value={mainCrops} onChange={(e) => setMainCrops(e.target.value)}
                    placeholder="e.g. Rice, Wheat, Vegetables"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Farm Size <span className="text-[#c9a227] font-bold">(acres)</span>
                    </label>
                    <input type="number" min="0" value={farmSize} onChange={(e) => setFarmSize(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year Started</label>
                    <input type="number" min="1900" max={new Date().getFullYear()} value={established} onChange={(e) => setEstablished(e.target.value)}
                      placeholder="e.g. 2010"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1c3a2a] bg-[#f8f4ed]" />
                  </div>
                </div>
              </>
            )}

            <button onClick={handleCompleteProfile} disabled={loading}
              className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {loading && <Spinner />}{loading ? "Saving…" : `Join as ${roles.find(r => r.id === role)?.title} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
