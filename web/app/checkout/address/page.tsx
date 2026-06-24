"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const schema = yup.object({
  name:     yup.string().trim().required("Full name is required").min(2, "Minimum 2 characters"),
  mobile:   yup.string().required("Mobile is required").matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  flat:     yup.string().trim().required("Flat / House is required").min(3, "Minimum 3 characters"),
  street:   yup.string().default(""),
  landmark: yup.string().default(""),
  city:     yup.string().trim().required("City is required").min(2, "Minimum 2 characters"),
  state:    yup.string().required("State is required"),
  pincode:  yup.string().required("Pincode is required").matches(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const inputCls = (err: boolean) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 bg-[#f8f4ed] transition-colors ${
    err ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-[#1c3a2a]"
  }`;

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-red-500 text-[11px] mt-1 leading-tight">⚠ {msg}</p> : null;

export default function AddressPage() {
  const router = useRouter();
  const [states, setStates] = useState<string[]>(["Telangana", "Andhra Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu"]);

  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data?.states)) setStates(d.data.states); })
      .catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: { state: "Telangana" },
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    const addr = `${data.flat}, ${data.street ?? ""}, ${data.landmark ? data.landmark + ", " : ""}${data.city}, ${data.state} - ${data.pincode}`;
    sessionStorage.setItem("deliveryAddress", addr);
    sessionStorage.setItem("deliveryName", data.name);
    router.push("/checkout/payment");
  };

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {["Cart", "Address", "Payment", "Done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 1 ? "bg-[#1c3a2a] text-white" : i < 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-semibold ${i === 1 ? "text-[#1c3a2a]" : "text-gray-400"}`}>{s}</span>
              {i < 3 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-[#1c3a2a]" />
            <h1 className="text-xl font-bold text-[#1c3a2a]">Delivery Address</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input {...register("name")} placeholder="Enter your Name" className={inputCls(!!errors.name)} />
                <Err msg={errors.name?.message} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile *</label>
                <input type="tel" {...register("mobile")} placeholder="Enter Mobile Number" maxLength={10} className={inputCls(!!errors.mobile)} />
                <Err msg={errors.mobile?.message} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Flat / House / Building *</label>
              <input {...register("flat")} placeholder="Enter Address" className={inputCls(!!errors.flat)} />
              <Err msg={errors.flat?.message} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Street / Area</label>
              <input {...register("street")} placeholder="Enter Street / Area" className={inputCls(false)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Landmark</label>
              <input {...register("landmark")} placeholder="Enter Landmark" className={inputCls(false)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                <input {...register("city")} placeholder="Enter City" className={inputCls(!!errors.city)} />
                <Err msg={errors.city?.message} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <select {...register("state")} className={inputCls(false)}>
                  {states.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode *</label>
                <input {...register("pincode")} placeholder="500001" maxLength={6} className={inputCls(!!errors.pincode)} />
                <Err msg={errors.pincode?.message} />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-[#1c3a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#2d5a3d] transition-colors"
            >
              Continue to Payment →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
