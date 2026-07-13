"use client";
import { useState } from "react";
import { MapPin, Plus, Home, Briefcase, Trash2 } from "lucide-react";

const SAMPLE = [
  { id: 1, type: "Home", name: "Ravi Kumar", line: "Flat 4B, Green Towers, MG Road", city: "Hyderabad", state: "Telangana", pin: "500001", default: true },
  { id: 2, type: "Work", name: "Ravi Kumar", line: "Office Block C, Hitech City", city: "Hyderabad", state: "Telangana", pin: "500081", default: false },
];

export default function AddressPage() {
  const [addresses, setAddresses] = useState(SAMPLE);

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#1c3a2a] flex items-center gap-2"><MapPin className="w-5 h-5" />Saved Addresses</h1>
          <button className="flex items-center gap-1.5 bg-[#1c3a2a] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2d5a3d] transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  {a.type === "Home" ? <Home className="w-4 h-4 text-[#1c3a2a]" /> : <Briefcase className="w-4 h-4 text-[#1c3a2a]" />}
                  <span className="text-sm font-bold text-[#1c3a2a]">{a.type}</span>
                  {a.default && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <button onClick={() => setAddresses((prev) => prev.filter((x) => x.id !== a.id))} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-700">{a.name}</p>
              <p className="text-sm text-gray-500">{a.line}</p>
              <p className="text-sm text-gray-500">{a.city}, {a.state} - {a.pin}</p>
              {!a.default && (
                <button onClick={() => setAddresses((prev) => prev.map((x) => ({ ...x, default: x.id === a.id })))}
                  className="mt-3 text-xs text-[#1c3a2a] font-semibold hover:underline">
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
