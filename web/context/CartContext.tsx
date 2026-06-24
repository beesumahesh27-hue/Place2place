"use client";
import { createContext, useContext, useState, useCallback } from "react";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
  videos: string[];
  variants: string[];
  status: string;
  quantity: number;
  deliveryTime: string;
  organic: boolean;
  category: { id: string; slug: string; label: string; icon: string };
  producer: { id: string; name: string; businessName?: string; businessLocation?: string };
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
  variant: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: CartProduct, variant: string) => void;
  removeItem: (productId: string, variant: string) => void;
  updateQty: (productId: string, variant: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: CartProduct, variant: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.variant === variant);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.variant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, variant }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variant: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.variant === variant)));
  }, []);

  const updateQty = useCallback((productId: string, variant: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.variant === variant)));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId && i.variant === variant ? { ...i, quantity: qty } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
