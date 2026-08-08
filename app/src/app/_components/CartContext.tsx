"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type CartItem = {
  photoId: string;
  bibNumber: string | null;
  url: string;
  price: number;
};

/**
 * The "todas tus fotos por $X" offer for the current search.
 *
 * `ids` is the complete result set it covers — never a page of it. `bib` or
 * `token` is what the server re-checks before honouring the flat price, so an
 * offer without either can't be built. `individualTotal` is what those same
 * photos would cost one by one, which is how we know it's actually a deal.
 *
 * It lives here because the nav cart is rendered outside the results view and
 * still has to show the same total the checkout will charge.
 */
export type PackOffer = {
  ids: string[];
  bib: string | null;
  token: string | null;
  individualTotal: number;
};

type CartCtx = {
  items: CartItem[];
  inCart: (photoId: string) => boolean;
  toggle: (item: CartItem) => void;
  clear: () => void;
  pack: PackOffer | null;
  setPack: (pack: PackOffer | null) => void;
};

const CartContext = createContext<CartCtx>({
  items: [],
  inCart: () => false,
  toggle: () => undefined,
  clear: () => undefined,
  pack: null,
  setPack: () => undefined,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pack, setPack] = useState<PackOffer | null>(null);

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
    <CartContext.Provider value={{ items, inCart, toggle, clear, pack, setPack }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
