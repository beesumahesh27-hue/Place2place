"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type NotifType = "order_placed" | "order_accepted" | "order_shipped" | "order_delivered" | "stock_low" | "stock_out";

export type Notification = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  referenceId?: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) { setNotifications([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch on login/logout and every 30 s while logged in
  useEffect(() => {
    if (!isLoggedIn) { setNotifications([]); return; }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [isLoggedIn, fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    if (!token) return;
    fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [token]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!token) return;
    fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, refresh: fetchNotifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
