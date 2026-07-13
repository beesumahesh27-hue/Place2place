"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type UserRole = "CUSTOMER" | "PRODUCER" | "DC";

export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  businessName?: string;
  businessLocation?: string;
};

export type Order = {
  id: string;
  date: string;
  items: { name: string; variant: string; qty: number; price: number }[];
  total: number;
  address: string;
  status: "confirmed" | "packed" | "out_for_delivery" | "delivered";
  paymentMethod: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  orders: Order[];
  login: (user: User, token: string) => void;
  logout: () => void;
  addOrder: (order: Order) => void;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("p2p_auth");
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setUser(user);
        setToken(token);
      } catch { /* invalid stored data */ }
    }
  }, []);

  const login = useCallback((u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("p2p_auth", JSON.stringify({ user: u, token: t }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("p2p_auth");
  }, []);

  const addOrder = useCallback((o: Order) => setOrders((prev) => [o, ...prev]), []);

  return (
    <AuthContext.Provider value={{ user, token, orders, login, logout, addOrder, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
