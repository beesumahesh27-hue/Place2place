"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { MapPin, CreditCard, Heart, ShoppingBag, ChevronRight, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const links = [
    { icon: MapPin,      label: "Saved Addresses",   href: "/profile/address",  desc: "Manage delivery addresses" },
    { icon: CreditCard,  label: "Saved Cards",        href: "/profile/cards",    desc: "Payment methods" },
    { icon: Heart,       label: "My Wishlist",        href: "/profile/items",    desc: "Saved products" },
    { icon: ShoppingBag, label: "My Orders",          href: "/orders",           desc: "Order history & tracking" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f4ed] py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Avatar card */}
        <div className="bg-[#1c3a2a] rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#c9a227] flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">{user?.name}</h1>
            {user?.mobile && <p className="text-white/70 text-sm mt-0.5">+91 {user.mobile}</p>}
            {user?.email && (
              <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                {user.email} <CheckCircle className="w-3 h-3 text-green-400" />
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#1c3a2a] text-sm uppercase tracking-wide">Account Details</h2>
          {[
            { label: "Full Name",  value: user?.name },
            { label: "Mobile",     value: user?.mobile ? `+91 ${user.mobile}` : "—" },
            { label: "Email",      value: user?.email || "—" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-semibold text-[#1c3a2a]">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          {links.map(({ icon: Icon, label, href, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-5 py-4 hover:bg-[#f8f4ed] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#e8f0eb] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#1c3a2a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1c3a2a]">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
