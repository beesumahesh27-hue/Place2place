"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Plus, Trash2 } from "lucide-react";

const SAMPLE = [
  { id: 1, type: "Visa",       last4: "4242", expiry: "12/27", name: "RAVI KUMAR",  color: "from-blue-600 to-blue-800" },
  { id: 2, type: "Mastercard", last4: "8765", expiry: "08/26", name: "RAVI KUMAR",  color: "from-orange-500 to-red-600" },
];

export default function CardsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState(SAMPLE);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#1c3a2a] flex items-center gap-2"><CreditCard className="w-5 h-5" />Saved Cards</h1>
          <button className="flex items-center gap-1.5 bg-[#1c3a2a] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2d5a3d] transition-colors">
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((c) => (
            <div key={c.id} className="relative">
              <div className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold opacity-80">{c.type}</span>
                  <CreditCard className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-lg font-bold tracking-widest mb-4">•••• •••• •••• {c.last4}</p>
                <div className="flex justify-between text-xs opacity-80">
                  <span>{c.name}</span>
                  <span>Expires {c.expiry}</span>
                </div>
              </div>
              <button onClick={() => setCards((prev) => prev.filter((x) => x.id !== c.id))}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">Cards are stored securely. CVV is never saved.</p>
      </div>
    </div>
  );
}
