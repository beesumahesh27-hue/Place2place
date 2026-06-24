"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart();
  const [delivery, setDelivery] = useState(49);

  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((d) => { if (d.data?.deliveryFee) setDelivery(d.data.deliveryFee); })
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">Your cart is empty</h2>
        <Link href="/products" className="bg-[#1c3a2a] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#2d5a3d] transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const grandTotal = totalPrice + delivery;

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1c3a2a] mb-6">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Items */}
          <div className="flex-1 space-y-3">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.variant}`} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/80x80/e8f0eb/1c3a2a?text=IMG`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#c9a227] font-semibold">{item.product.producer.businessName ?? item.product.producer.name}</p>
                  <h3 className="font-bold text-[#1c3a2a] truncate">{item.product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Variant: {item.variant}</p>
                  <p className="font-bold text-[#1c3a2a] mt-1">₹{item.product.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.product.id, item.variant)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-[#f8f4ed] rounded-full px-2 py-1">
                    <button onClick={() => updateQty(item.product.id, item.variant, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.variant, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-24">
              <h2 className="font-bold text-[#1c3a2a] text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>₹{delivery}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-[#1c3a2a] text-base">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <Link
                href="/checkout/address"
                className="mt-5 block w-full bg-[#1c3a2a] text-white text-center font-bold py-3 rounded-xl hover:bg-[#2d5a3d] transition-colors"
              >
                Proceed to Checkout →
              </Link>
              <Link href="/products" className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-[#1c3a2a] transition-colors py-2">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
