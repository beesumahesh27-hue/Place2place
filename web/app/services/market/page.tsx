"use client";
import { useState, useEffect, useCallback } from "react";
import { Store, CalendarDays, ChevronLeft, ChevronRight, CheckCircle, Clock, MapPin, User, Phone, History, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────
type Role = "apartment" | "colony" | "";
type Outcome = "Good" | "Average" | "Bad";

type Booking = {
  id: string;
  role: string;
  apartmentName: string;
  address: string;
  contactName: string;
  mobile: string;
  date: string;
  timeSlot: string;
  status: string;
  itemsSold: number | null;
  feedback: string | null;
  outcome: Outcome | null;
  createdAt: string;
};

// ── Yup schema ─────────────────────────────────────────────────────────────
const marketSchema = yup.object({
  role:          yup.string().required("Please select your role").oneOf(["apartment", "colony"] as const, "Please select your role"),
  location:      yup.string().trim().required("Apartment / Colony name is required").min(4, "Enter at least 4 characters"),
  address:       yup.string().trim().required("Full address is required").min(6, "Enter a more complete address"),
  contactName:   yup.string().trim().required("Contact person name is required").min(2, "Minimum 2 characters"),
  contactMobile: yup.string().required("Mobile number is required").matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  selectedDate:  yup.date().typeError("Please select a date").required("Please select a date"),
  selectedTime:  yup.string().required("Please select a time slot"),
});

type MarketForm = yup.InferType<typeof marketSchema>;

const OUTCOME_STYLE: Record<Outcome, string> = {
  Good:    "bg-green-100 text-green-700",
  Average: "bg-amber-100 text-amber-700",
  Bad:     "bg-red-100 text-red-600",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const TIME_SLOTS = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = (err: boolean) =>
  `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 bg-[#f8f4ed] transition-colors ${
    err ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-[#1c3a2a]"
  }`;

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-red-500 text-[11px] mt-1 leading-tight">⚠ {msg}</p> : null;

// ── Mini Calendar ───────────────────────────────────────────────────────────
function Calendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prev = () => setView(new Date(year, month - 1, 1));
  const next = () => setView(new Date(year, month + 1, 1));
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isPast     = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d: number) => selected?.getDate() === d && selected?.getMonth() === month && selected?.getFullYear() === year;
  const isToday    = (d: number) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  return (
    <div className="bg-[#f8f4ed] rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-white transition-colors"><ChevronLeft className="w-4 h-4 text-[#1c3a2a]" /></button>
        <span className="font-bold text-[#1c3a2a] text-sm">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-white transition-colors"><ChevronRight className="w-4 h-4 text-[#1c3a2a]" /></button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const past = isPast(day), sel = isSelected(day), tod = isToday(day);
          return (
            <button key={i} disabled={past} onClick={() => onSelect(new Date(year, month, day))}
              className={`h-9 w-full rounded-lg text-sm font-semibold transition-all ${
                past ? "text-gray-300 cursor-not-allowed"
                : sel ? "bg-[#1c3a2a] text-white shadow-md"
                : tod ? "bg-white text-[#1c3a2a] ring-2 ring-[#1c3a2a]"
                : "text-gray-700 hover:bg-white"}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MarketAtYourPlacePage() {
  const [booked, setBooked] = useState(false);
  const [submitted, setSubmitted] = useState<MarketForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, trigger, reset, formState: { errors } } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(marketSchema) as any,
    mode: "onTouched",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { role: "", location: "", address: "", contactName: "", contactMobile: "", selectedTime: "", selectedDate: null as any },
  });

  const watchedRole   = watch("role") as Role;
  const watchedDate   = watch("selectedDate") as Date | undefined;
  const watchedTime   = watch("selectedTime");
  const watchedMobile = watch("contactMobile") ?? "";

  const fetchHistory = useCallback((mobile: string) => {
    setHistoryLoading(true);
    fetch(`${API}/bookings?mobile=${mobile}`)
      .then((r) => r.json())
      .then((res) => setBookings(res.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (watchedMobile.length === 10) {
      fetchHistory(watchedMobile);
    } else {
      setBookings([]);
    }
  }, [watchedMobile, fetchHistory]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: data.role,
          apartmentName: data.location,
          address: data.address,
          contactName: data.contactName,
          mobile: data.contactMobile,
          date: (data.selectedDate as Date).toISOString(),
          timeSlot: data.selectedTime,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to book appointment");
      }
      setSubmitted(data as unknown as MarketForm);
      setBooked(true);
      if (data.contactMobile.length === 10) fetchHistory(data.contactMobile);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  });

  const resetForm = () => { setBooked(false); setSubmitted(null); reset(); };

  const formatDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const roleLabel = (r: string) =>
    r === "apartment" ? "Apartment President" : r === "colony" ? "Colony President" : "";

  const outcomeBadge = (b: Booking) => {
    if (b.outcome) {
      return <span className={`text-xs font-bold px-3 py-1 rounded-full ${OUTCOME_STYLE[b.outcome]}`}>{b.outcome}</span>;
    }
    return <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f8f4ed]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1c3a2a] to-[#2d5a3d] px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Market at Your Place</h1>
              <p className="text-white/60 text-sm mt-0.5">Exclusively for Apartment & Colony Presidents</p>
            </div>
          </div>
          <p className="text-white/75 text-base leading-relaxed max-w-2xl mt-4">
            Are you an <strong>Apartment Residents President</strong> or a <strong>Colony President</strong>?
            Bring Place2Place directly to your community! We set up a mini-market in your premises —
            fresh ghee, honey, oils, rice, spices and more — so your residents shop without stepping out.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6">
            {[
              { icon: "🏘️", label: "Apartments & Colonies" },
              { icon: "📦", label: "50+ Products On-site" },
              { icon: "🆓", label: "Zero Setup Cost" },
              { icon: "📅", label: "Flexible Scheduling" },
              { icon: "🧾", label: "Invoice Provided" },
              { icon: "⭐", label: "Resident Feedback" },
            ].map((b) => (
              <div key={b.label} className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-xl mb-1">{b.icon}</p>
                <p className="text-xs font-semibold text-white/90">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Booking / Success ── */}
        {booked && submitted ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#1c3a2a] mb-1">Appointment Booked!</h2>
            <p className="text-gray-500 text-sm mb-4">Our team will reach out to confirm within 2 hours.</p>
            <div className="bg-[#f8f4ed] rounded-xl p-4 text-left space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-[#1c3a2a] shrink-0" />
                <span className="font-semibold">{submitted.contactName} · {roleLabel(submitted.role)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[#1c3a2a] shrink-0" />
                <span className="font-semibold">+91 {submitted.contactMobile}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-[#1c3a2a] shrink-0 mt-0.5" />
                <span className="font-semibold">{submitted.location}<br /><span className="font-normal text-xs text-gray-500">{submitted.address}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="w-4 h-4 text-[#1c3a2a] shrink-0" />
                <span className="font-semibold">{formatDate(submitted.selectedDate as Date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-[#1c3a2a] shrink-0" />
                <span className="font-semibold">{submitted.selectedTime}</span>
              </div>
            </div>
            <button onClick={resetForm} className="mt-5 text-sm text-[#1c3a2a] font-semibold hover:underline">
              Book another appointment →
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-[#1c3a2a] text-lg flex items-center gap-2 mb-6">
                <CalendarDays className="w-5 h-5" /> Book an Appointment
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* ── Left column ── */}
                <div className="space-y-5">

                  {/* Role radio */}
                  <Field label="I am a" required>
                    <div className="flex gap-3">
                      {[
                        { value: "apartment", label: "Apartment President" },
                        { value: "colony",    label: "Colony President" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex-1 flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all ${
                            watchedRole === opt.value
                              ? "border-[#1c3a2a] bg-[#e8f0eb]"
                              : errors.role
                              ? "border-red-300 hover:border-red-400"
                              : "border-gray-200 hover:border-[#1c3a2a]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            {...register("role")}
                            onChange={() => { setValue("role", opt.value as "apartment" | "colony"); trigger("role"); }}
                            className="accent-[#1c3a2a] w-4 h-4 shrink-0"
                          />
                          <span className="text-sm font-semibold text-[#1c3a2a]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <Err msg={errors.role?.message} />
                  </Field>

                  {/* Apartment / Colony name */}
                  <Field label="Apartment / Colony Name" required>
                    <input
                      {...register("location")}
                      placeholder="e.g. Green Valley Apartments, Banjara Hills"
                      className={inputCls(!!errors.location)}
                    />
                    <Err msg={errors.location?.message} />
                  </Field>

                  {/* Full address */}
                  <Field label="Full Address" required>
                    <textarea
                      {...register("address")}
                      rows={2}
                      placeholder="Door/Flat no., Street, Area, City – PIN"
                      className={`${inputCls(!!errors.address)} resize-none`}
                    />
                    <Err msg={errors.address?.message} />
                  </Field>

                  {/* Contact person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Contact Person" required>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register("contactName")}
                          placeholder="Full name"
                          className={`${inputCls(!!errors.contactName)} pl-9`}
                        />
                      </div>
                      <Err msg={errors.contactName?.message} />
                    </Field>
                    <Field label="Mobile Number" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">+91</span>
                        <input
                          {...register("contactMobile")}
                          placeholder="10-digit number"
                          maxLength={10}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setValue("contactMobile", digits);
                            trigger("contactMobile");
                          }}
                          className={`${inputCls(!!errors.contactMobile)} pl-10`}
                        />
                      </div>
                      <Err msg={errors.contactMobile?.message} />
                    </Field>
                  </div>

                  {/* Time slots */}
                  <Field label="Preferred Time" required>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setValue("selectedTime", t); trigger("selectedTime"); }}
                          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                            watchedTime === t
                              ? "bg-[#1c3a2a] text-white border-[#1c3a2a]"
                              : errors.selectedTime
                              ? "bg-white text-gray-600 border-red-300 hover:border-red-400"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#1c3a2a]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <Err msg={errors.selectedTime?.message} />
                  </Field>

                  {watchedDate && (
                    <div className="bg-[#e8f0eb] rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-[#1c3a2a] font-semibold">{formatDate(watchedDate)}</span>
                    </div>
                  )}
                  {errors.selectedDate && !watchedDate && <Err msg={errors.selectedDate.message as string} />}

                  {submitError && (
                    <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠ {submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : "Book Appointment →"}
                  </button>

                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
                    <strong>Note:</strong> This service is exclusively for Apartment Residents Presidents and Colony Presidents.
                    Our team will verify your role before confirming.
                  </p>
                </div>

                {/* ── Right column: calendar ── */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${errors.selectedDate ? "text-red-500" : "text-gray-700"}`}>
                    Select Date <span className="text-red-400">*</span>
                  </label>
                  <Calendar
                    selected={watchedDate ?? null}
                    onSelect={(d) => { setValue("selectedDate", d); trigger("selectedDate"); }}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── Booking History ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-[#1c3a2a] text-lg flex items-center gap-2">
                <History className="w-5 h-5" /> My Booking History
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {watchedMobile.length === 10
                  ? `Showing ${bookings.length} booking(s) for +91 ${watchedMobile}`
                  : "Enter your mobile number above to see your past appointments"}
              </p>
            </div>
            {watchedMobile.length === 10 && bookings.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="bg-[#e8f0eb] text-[#1c3a2a] font-bold px-3 py-1 rounded-full">{bookings.length} total</span>
                <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{bookings.filter((b) => b.status === "PENDING").length} Pending</span>
                <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">{bookings.filter((b) => b.status === "CONFIRMED" || b.outcome === "Good").length} Confirmed</span>
              </div>
            )}
          </div>

          {watchedMobile.length < 10 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <History className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No mobile number entered</p>
              <p className="text-xs text-center max-w-xs">Fill in your mobile number in the booking form above to view your appointment history.</p>
            </div>
          ) : historyLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading bookings…</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <CalendarDays className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No appointments found</p>
              <p className="text-xs">No bookings for +91 {watchedMobile}. Book your first appointment above.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f4ed]">
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">#</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Booked On</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Event Date</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Location & Address</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Time Slot</th>
                      <th className="text-center px-6 py-3 text-xs font-bold text-[#1c3a2a] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((row, i) => (
                      <tr key={row.id} className="hover:bg-[#fafff8] transition-colors">
                        <td className="px-6 py-4 text-gray-400 text-xs font-semibold">{i + 1}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#1c3a2a] whitespace-nowrap text-xs">
                          {new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.role === "apartment" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {row.role === "apartment" ? "Apartment President" : "Colony President"}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="font-semibold text-[#1c3a2a] text-xs">{row.apartmentName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{row.address}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1 text-gray-400" />{row.timeSlot}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {outcomeBadge(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-50">
                {bookings.map((row, i) => (
                  <div key={row.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-semibold">#{i + 1} · {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      {outcomeBadge(row)}
                    </div>
                    <p className="text-sm font-semibold text-[#1c3a2a]">{row.apartmentName}</p>
                    <p className="text-[10px] text-gray-400">{row.address}</p>
                    <p className="text-xs text-gray-500">
                      {row.role === "apartment" ? "Apartment President" : "Colony President"} · {row.contactName}
                    </p>
                    <p className="text-xs text-gray-500">
                      <CalendarDays className="w-3 h-3 inline mr-1" />
                      {new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      &nbsp;·&nbsp;<Clock className="w-3 h-3 inline mr-1" />{row.timeSlot}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-[#f8f4ed] text-xs text-gray-500">
                <span>Total bookings: <strong className="text-[#1c3a2a]">{bookings.length}</strong></span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
