"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type CartItem = {
  photoId: string;
  bibNumber: string | null;
  url: string;
  price: number;
};

type CartCtx = {
  items: CartItem[];
  inCart: (photoId: string) => boolean;
  toggle: (item: CartItem) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx>({
  items: [],
  inCart: () => false,
  toggle: () => undefined,
  clear: () => undefined,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const inCart = useCallback((photoId: string) =>
    items.some((i) => i.photoId === photoId), [items]);

  const toggle = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.photoId === item.photoId);
      return exists ? prev.filter((i) => i.photoId !== item.photoId) : [...prev, item];
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, inCart, toggle, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
