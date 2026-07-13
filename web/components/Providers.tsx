"use client";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>{children}</CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
