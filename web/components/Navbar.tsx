"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, User, LogOut, Package, ChevronDown, Bell, Menu, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import Sidebar from "@/components/Sidebar";
import NotificationPanel from "@/components/NotificationPanel";

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  const { totalItems }                         = useCart();
  const { user, logout, isLoggedIn }           = useAuth();
  const { unreadCount }                        = useNotifications();

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 shadow-md" style={{ background: "linear-gradient(135deg, #fff8e1 0%, #ffe0b2 40%, #ffb347 100%)"}}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* Hamburger — left */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#1c3a2a] hover:bg-white/30 p-2 rounded-xl transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.svg" alt="Place2Place" width={40} height={40} className="object-contain" />
            <div className="hidden sm:block">
              <div className="text-[#1c3a2a] font-bold text-base leading-none">Place2Place</div>
              <div className="text-[#2d5a3d] text-[10px] tracking-wide font-semibold">From Local Factory to Your Place</div>
            </div>
          </Link>

          {/* Search — centre */}
          <div className="flex-1 flex justify-center px-2">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/products?q=${search}`)}
                placeholder="Search ghee, honey, rice..."
                className="w-full bg-white rounded-full pl-10 pr-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#c9a227]"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
                className="relative text-[#1c3a2a] hover:bg-white/30 p-2 rounded-xl transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative text-[#1c3a2a] hover:bg-white/30 p-2 rounded-xl transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#c9a227] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
                  className="flex items-center gap-1.5 bg-[#1c3a2a] text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[#2d5a3d] transition-colors ml-1"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Me"}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-bold text-[#1c3a2a]">{user?.name}</p>
                      <p className="text-[10px] text-gray-400">{user?.email || (user?.mobile ? `+91 ${user.mobile}` : "")}</p>
                    </div>
                    {(user?.role === "PRODUCER" || user?.role === "DC") && (
                      <Link href="/producer" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f8f4ed] transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-[#1c3a2a]" /> Producer Dashboard
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f8f4ed] transition-colors">
                      <User className="w-4 h-4 text-[#1c3a2a]" /> My Profile
                    </Link>
                    {user?.role === "CUSTOMER" && (
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f8f4ed] transition-colors">
                        <Package className="w-4 h-4 text-[#1c3a2a]" /> My Orders
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); router.push("/"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login"
                className="bg-[#1c3a2a] text-white font-bold px-4 py-1.5 rounded-full text-sm hover:bg-[#2d5a3d] transition-colors ml-1">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
