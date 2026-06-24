"use client";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-2xl mx-auto text-center py-16 text-gray-400">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-500 mb-1">Wishlist coming soon</p>
        <p className="text-sm mb-4">Save your favourite products here.</p>
        <Link href="/products" className="inline-block text-[#1c3a2a] font-semibold hover:underline text-sm">
          Browse Products →
        </Link>
      </div>
    </div>
  );
}
