"use client";
import { useNotifications, NotifType } from "@/context/NotificationContext";
import { Bell, Package, Truck, CheckCircle, AlertTriangle, X, Loader2 } from "lucide-react";

const iconMap: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  order_placed:    { icon: Package,       bg: "bg-blue-100",   color: "text-blue-600"   },
  order_accepted:  { icon: CheckCircle,   bg: "bg-amber-100",  color: "text-amber-600"  },
  order_shipped:   { icon: Truck,         bg: "bg-indigo-100", color: "text-indigo-600" },
  order_delivered: { icon: CheckCircle,   bg: "bg-green-100",  color: "text-green-600"  },
  stock_low:       { icon: AlertTriangle, bg: "bg-yellow-100", color: "text-yellow-600" },
  stock_out:       { icon: AlertTriangle, bg: "bg-red-100",    color: "text-red-600"    },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Props = { isOpen: boolean; onClose: () => void };

export default function NotificationPanel({ isOpen, onClose }: Props) {
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all duration-200 origin-top-right ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1c3a2a]" />
            <span className="font-bold text-[#1c3a2a] text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-[#c9a227] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#1c3a2a] font-semibold hover:underline">Mark all read</button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No notifications</div>
          ) : (
            notifications.map((n) => {
              const meta = iconMap[n.type] ?? { icon: Bell, bg: "bg-gray-100", color: "text-gray-500" };
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f8f4ed] transition-colors border-b border-gray-50 last:border-0 ${!n.read ? "bg-[#fafff8]" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.read ? "text-gray-600" : "text-[#1c3a2a]"}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-[#c9a227] rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5 text-center">
          <span className="text-xs text-gray-400">Last 50 notifications</span>
        </div>
      </div>
    </>
  );
}
