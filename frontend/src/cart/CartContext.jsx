// frontend/src/cart/CartContext.jsx
// Single source for cart state. Guests use localStorage ("cart_v1");
// logged-in users use the backend cart (source of truth, cross-device).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, getToken } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const LS_CART_KEY = "cart_v1";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

/* ---------- guest cart (localStorage) ---------- */
function readLocalCart() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_CART_KEY));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeLocalCart(items) {
  try {
    localStorage.setItem(LS_CART_KEY, JSON.stringify(items));
  } catch {}
}

/* ---------- server cart helpers ---------- */
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function productImage(product) {
  const imgs = product?.images || [];
  const primary = imgs.find((i) => i.isPrimary) || imgs[0];
  if (!primary?.url) return "/best/best1.jpg";
  return primary.url.startsWith("http")
    ? primary.url
    : `${API_BASE.replace("/api", "")}${primary.url}`;
}

// Normalize a server cart payload into the same item shape guests use,
// so every page renders identically in both modes.
function normalizeServerCart(cart) {
  return (cart?.items || []).map((it) => ({
    id: it.product?.id,           // stable key used by the UI
    itemId: it.id,                // server cart-item id, used for PATCH/DELETE
    productId: it.product?.id,
    name: it.product?.name || "Product",
    price: Number(it.unitPrice ?? it.product?.salePrice ?? it.product?.price ?? 0),
    compareAt:
      it.product?.salePrice != null ? Number(it.product.price) : undefined,
    image: productImage(it.product),
    slug: it.product?.slug,
    qty: it.quantity || 1,
  }));
}

export default function CartProvider({ children }) {
  const auth = useAuth() || {};
  const user = auth.user || null;

  const [items, setItems] = useState(() => (user ? [] : readLocalCart()));
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState("");

  // Guards against React StrictMode double-running the login effect.
  const mergedForUser = useRef(null);

  const fetchServerCart = useCallback(async () => {
    const res = await fetch(`${API_BASE}/cart`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to load cart");
    const cart = await res.json();
    setItems(normalizeServerCart(cart));
  }, []);

  // On login: merge guest cart into server cart once, then mirror the server.
  // On logout: drop to an empty guest cart (backend cart is preserved).
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      mergedForUser.current = null;
      setItems(readLocalCart());
      setLoading(false);
      setError("");
      return;
    }

    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    (async () => {
      setLoading(true);
      setError("");

      // Take the guest cart and clear it synchronously BEFORE any await,
      // so a second effect run (StrictMode) finds nothing to merge.
      const guestItems = readLocalCart().filter((it) => it.productId);
      writeLocalCart([]);

      for (const it of guestItems) {
        try {
          await fetch(`${API_BASE}/cart/items`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ productId: it.productId, quantity: it.qty || 1 }),
          });
        } catch {
          // skip items the server rejects (out of stock / deactivated);
          // never abort the whole merge for one bad item
        }
      }

      try {
        if (!cancelled) await fetchServerCart();
      } catch {
        if (!cancelled) setError("Could not load your cart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, fetchServerCart]);

  /* ---------- actions (guest -> localStorage, user -> API) ---------- */

  // overrides lets callers keep page-specific entry data for guest carts
  // (e.g. ProductDetails option variants and option-adjusted prices).
  const add = useCallback(
    async (product, qty = 1, overrides = {}) => {
      setError("");
      const entry = {
        id: product.id,
        productId: product.id,
        name: product.name,
        price:
          product.salePrice != null ? Number(product.salePrice) : Number(product.price),
        compareAt: product.salePrice != null ? Number(product.price) : undefined,
        image: productImage(product),
        slug: product.slug,
        qty,
        ...overrides,
      };

      if (!user) {
        setItems((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.id === entry.id);
          if (idx >= 0) next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + qty };
          else next.push(entry);
          writeLocalCart(next);
          return next;
        });
        return true;
      }

      try {
        const res = await fetch(`${API_BASE}/cart/items`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ productId: product.id, quantity: qty }),
        });
        const cart = await res.json();
        if (!res.ok) throw new Error(cart.message || "Could not add to cart");
        setItems(normalizeServerCart(cart));
        return true;
      } catch (e) {
        setError(e.message || "Could not add to cart.");
        return false;
      }
    },
    [user]
  );

  const updateQty = useCallback(
    async (item, qty) => {
      setError("");
      const newQty = Math.max(1, qty);

      if (!user) {
        setItems((prev) => {
          const next = prev.map((x) =>
            x.productId === item.productId ? { ...x, qty: newQty } : x
          );
          writeLocalCart(next);
          return next;
        });
        return true;
      }

      try {
        const res = await fetch(`${API_BASE}/cart/items/${item.itemId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ quantity: newQty }),
        });
        const cart = await res.json();
        if (!res.ok) throw new Error(cart.message || "Could not update quantity");
        setItems(normalizeServerCart(cart));
        return true;
      } catch (e) {
        setError(e.message || "Could not update quantity.");
        return false;
      }
    },
    [user]
  );

  const remove = useCallback(
    async (item) => {
      setError("");

      if (!user) {
        setItems((prev) => {
          const next = prev.filter((x) => x.productId !== item.productId);
          writeLocalCart(next);
          return next;
        });
        return true;
      }

      try {
        const res = await fetch(`${API_BASE}/cart/items/${item.itemId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        const cart = await res.json();
        if (!res.ok) throw new Error(cart.message || "Could not remove item");
        setItems(normalizeServerCart(cart));
        return true;
      } catch (e) {
        setError(e.message || "Could not remove item.");
        return false;
      }
    },
    [user]
  );

  // Called after a successful order: server already emptied its cart
  // inside the checkout transaction, so only local state needs resetting.
  const reset = useCallback(() => {
    if (!user) writeLocalCart([]);
    setItems([]);
  }, [user]);

  // Explicit "clear all" from the cart page (guest: wipe local; user: wipe server).
  const clearAll = useCallback(async () => {
    setError("");
    if (!user) {
      writeLocalCart([]);
      setItems([]);
      return true;
    }
    try {
      const res = await fetch(`${API_BASE}/cart`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Could not clear cart");
      setItems([]);
      return true;
    } catch (e) {
      setError(e.message || "Could not clear cart.");
      return false;
    }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) { setItems(readLocalCart()); return; }
    try { await fetchServerCart(); } catch {}
  }, [user, fetchServerCart]);

  const count = items.reduce((s, i) => s + (i.qty || 1), 0);
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  const value = useMemo(
    () => ({ items, count, subtotal, loading, error, add, updateQty, remove, reset, refresh, clearAll }),
    [items, count, subtotal, loading, error, add, updateQty, remove, reset, refresh, clearAll]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
