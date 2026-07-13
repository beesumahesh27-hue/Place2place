"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  X, User, MapPin, CreditCard, Factory, Milk, Leaf,
  Truck, HelpCircle, LogOut, ChevronRight, ShoppingBag, Store, Home,
  LayoutDashboard,
} from "lucide-react";

type SidebarProps = { isOpen: boolean; onClose: () => void };

const customerSections = [
  {
    heading: "My Account",
    items: [
      { icon: Home,        label: "Home",           href: "/",                desc: "Back to main page" },
      { icon: User,        label: "Profile",        href: "/profile",         desc: "Personal info & settings" },
      { icon: MapPin,      label: "Address",        href: "/profile/address", desc: "Saved delivery addresses" },
      { icon: CreditCard,  label: "Saved Cards",    href: "/profile/cards",   desc: "Manage payment methods" },
      { icon: ShoppingBag, label: "My Orders",      href: "/orders",          desc: "Track & view past orders" },
    ],
  },
  {
    heading: "Linked Services",
    items: [
      { icon: Factory, label: "Agriculture Partners",  href: "/services/factory", desc: "Local factories & producers" },
      { icon: Milk,    label: "Dairy Partners",       href: "/services/dairy",   desc: "Fresh milk & dairy farms" },
      { icon: Leaf,    label: "Farmer Network",       href: "/services/farmer",  desc: "Organic farm partnerships" },
      { icon: Store,   label: "Market at Your Place", href: "/services/market",  desc: "Bring the market to your colony" },
    ],
  },
  {
    heading: "About & Support",
    items: [
      { icon: Truck,      label: "About Our DC",   href: "/services/dc", desc: "Delivery centre operations" },
      { icon: HelpCircle, label: "Help & Support", href: "/support",     desc: "FAQs, contact us" },
    ],
  },
];

const producerSections = [
  {
    heading: "Dashboards",
    items: [
      { icon: LayoutDashboard, label: "Producer Dashboard", href: "/producer", desc: "Manage products, orders & stats" },
      { icon: Home,            label: "Customer Dashboard", href: "/",         desc: "Preview how customers see your products" },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const sections = user?.role === "PRODUCER" ? producerSections : customerSections;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="bg-[#1c3a2a] px-5 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-sm">P2P</div>
              <span className="text-white font-bold text-base">Place2Place</span>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#c9a227] flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{user?.name}</p>
                <p className="text-white/60 text-xs">{user?.mobile ? `+91 ${user.mobile}` : user?.email}</p>
              </div>
            </div>
          ) : (
            <Link href="/auth/login" onClick={onClose}
              className="block w-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 rounded-xl text-center transition-colors">
              Sign In / Register →
            </Link>
          )}
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-3">
          {sections.map((sec) => (
            <div key={sec.heading} className="mb-1">
              <p className="px-5 py-2 text-[10px] font-bold text-[#c9a227] uppercase tracking-widest">{sec.heading}</p>
              {sec.items.map(({ icon: Icon, label, href, desc }) => (
                <Link key={href} href={href} onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f4ed] transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f0eb] flex items-center justify-center shrink-0 group-hover:bg-[#1c3a2a] transition-colors">
                    <Icon className="w-4 h-4 text-[#1c3a2a] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1c3a2a]">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1c3a2a] transition-colors" />
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        {isLoggedIn && (
          <div className="border-t border-gray-100 p-4">
            <button onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
