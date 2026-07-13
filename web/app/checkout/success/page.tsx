"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, Home } from "lucide-react";

export default function SuccessPage() {
  const [orderId, setOrderId] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    setOrderId(sessionStorage.getItem("lastOrderId") || "ORD000000");
    setTotal(sessionStorage.getItem("lastOrderTotal") || "0");
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1c3a2a] mb-1">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-1">Your order has been placed successfully.</p>
        <p className="font-bold text-[#c9a227] text-lg mb-1">{orderId}</p>
        <p className="text-gray-500 text-sm mb-6">Amount Paid: <span className="font-bold text-[#1c3a2a]">₹{Number(total).toLocaleString()}</span></p>

        {/* Tracking visual */}
        <div className="bg-[#f8f4ed] rounded-2xl p-5 mb-6 text-left">
          <p className="text-xs font-bold text-[#c9a227] uppercase tracking-widest mb-4">Order Status</p>
          {[
            { label: "Order Confirmed", done: true, time: "Just now" },
            { label: "Being Packed", done: false, time: "~30 min" },
            { label: "Out for Delivery", done: false, time: "~2 hrs" },
            { label: "Delivered", done: false, time: "Estimated" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                {step.done ? "✓" : i + 1}
              </div>
              <div>
                <p className={`text-sm font-semibold ${step.done ? "text-[#1c3a2a]" : "text-gray-400"}`}>{step.label}</p>
                <p className="text-xs text-gray-400">{step.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/orders" className="flex-1 flex items-center justify-center gap-2 bg-[#1c3a2a] text-white font-bold py-3 rounded-xl hover:bg-[#2d5a3d] transition-colors text-sm">
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
