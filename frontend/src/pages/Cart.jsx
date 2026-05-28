// frontend/src/pages/Cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { useAuth } from "../auth/AuthContext";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../api/cart";

/* ✅ backend files base (strip /api) */
const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:3001/api";

const FILES_BASE = String(RAW_BASE).replace(/\/api\/?$/i, "");

function resolveImageUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${FILES_BASE}${url}`;
  if (url.startsWith("uploads/")) return `${FILES_BASE}/${url}`;
  return url;
}

function currency(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export default function Cart() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // normalized items from backend

  // Load backend cart
  const loadCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const cart = await getCart();

      const normalized = (cart?.items || []).map((it) => {
        const primary =
          it.product?.images?.find((img) => img?.isPrimary) ||
          it.product?.images?.[0];

        const rawUrl = typeof primary === "string" ? primary : primary?.url;

        return {
          // cart item id (NOT product id)
          id: it.id,
          qty: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || it.product?.price || 0),

          // product info
          productId: it.product?.id,
          slug: it.product?.slug,
          name: it.product?.name || "Product",
          image: resolveImageUrl(rawUrl) || null,

          // optional (frontend design)
          compareAt: null,
        };
      });

      setItems(normalized);
    } catch (err) {
      console.error("Failed to load cart:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const compareSubtotal = items.reduce(
      (s, it) =>
        s +
        (typeof it.compareAt === "number" ? it.compareAt : it.unitPrice) * it.qty,
      0
    );
    const savings = Math.max(0, compareSubtotal - subtotal);
    const shipping = items.length ? 0 : 0; // Free for now
    const grand = subtotal + shipping;
    return { subtotal, savings, shipping, grand };
  }, [items]);

  const totalQty = items.reduce((s, it) => s + it.qty, 0);

  const inc = async (cartItemId) => {
    const current = items.find((x) => x.id === cartItemId);
    if (!current) return;

    const nextQty = current.qty + 1;

    // optimistic UI
    setItems((arr) =>
      arr.map((it) => (it.id === cartItemId ? { ...it, qty: nextQty } : it))
    );

    try {
      await updateCartItem(cartItemId, nextQty);
    } catch (err) {
      console.error("Failed to increase qty:", err);
      alert(err.message || "Failed to update quantity");
      loadCart(); // rollback via reload
    }
  };

  const dec = async (cartItemId) => {
    const current = items.find((x) => x.id === cartItemId);
    if (!current) return;

    const nextQty = Math.max(1, current.qty - 1);

    setItems((arr) =>
      arr.map((it) => (it.id === cartItemId ? { ...it, qty: nextQty } : it))
    );

    try {
      await updateCartItem(cartItemId, nextQty);
    } catch (err) {
      console.error("Failed to decrease qty:", err);
      alert(err.message || "Failed to update quantity");
      loadCart();
    }
  };

  const removeItem = async (cartItemId) => {
    const prev = items;
    setItems((arr) => arr.filter((it) => it.id !== cartItemId));

    try {
      await removeCartItem(cartItemId);
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert(err.message || "Failed to remove item");
      setItems(prev);
    }
  };

  const clear = async () => {
    if (!items.length) return;
    const ok = confirm("Clear all items from cart?");
    if (!ok) return;

    const prev = items;
    setItems([]);

    try {
      await clearCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
      alert(err.message || "Failed to clear cart");
      setItems(prev);
    }
  };

  // If not logged in
  if (!isAuthenticated) {
    return (
      <main>
        <section
          style={{
            background:
              `linear-gradient(rgba(0,0,0,.30), rgba(0,0,0,.30)), url(/hero.jpeg) center/cover no-repeat`,
            color: "#fff",
            minHeight: isMobile ? 140 : 200,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            paddingTop: "clamp(84px, 14vw, 120px)",
            paddingBottom: isMobile ? 14 : 24,
            paddingInline: 12,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 24 : 38,
                lineHeight: 1.15,
                textShadow: "0 2px 14px rgba(0,0,0,.32)",
              }}
            >
              Your Cart
            </h1>
            <p style={{ marginTop: 6, opacity: 0.95, fontSize: isMobile ? 12.5 : 14.5 }}>
              Please login to view your cart.
            </p>
          </div>
        </section>

        <section
          style={{
            background: "#faf9fb",
            padding: isMobile ? "14px 10px 70px" : "36px 20px 90px",
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e6e1ea",
                borderRadius: 14,
                padding: isMobile ? 16 : 24,
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#6c5a80", fontWeight: 700 }}>
                You’re not logged in.
              </p>
              <div style={{ height: 12 }} />
              <button
                onClick={() => navigate("/login")}
                style={{
                  border: "none",
                  borderRadius: 12,
                  height: 48,
                  padding: "0 16px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                }}
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background:
            `linear-gradient(rgba(0,0,0,.30), rgba(0,0,0,.30)), url(/hero.jpeg) center/cover no-repeat`,
          color: "#fff",
          minHeight: isMobile ? 140 : 200,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          paddingTop: "clamp(84px, 14vw, 120px)",
          paddingBottom: isMobile ? 14 : 24,
          paddingInline: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 24 : 38,
              lineHeight: 1.15,
              textShadow: "0 2px 14px rgba(0,0,0,.32)",
            }}
          >
            Your Cart
          </h1>
          <p style={{ marginTop: 6, opacity: 0.95, fontSize: isMobile ? 12.5 : 14.5 }}>
            Handpicked resin pieces — almost yours ✨
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section
        style={{
          background: "#faf9fb",
          padding: isMobile ? "14px 10px 70px" : "36px 20px 90px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 2fr) 1fr",
            gap: isMobile ? 14 : 20,
            alignItems: "start",
          }}
        >
          {/* LEFT: Items */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e6e1ea",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              style={{
                padding: isMobile ? "10px 12px" : "12px 16px",
                borderBottom: "1px solid #eee7f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 800 }}>
                Cart ({totalQty} item{totalQty !== 1 ? "s" : ""})
              </div>

              {items.length > 0 && (
                <button
                  onClick={clear}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#a08fb6",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{ padding: isMobile ? 16 : 24, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#6c5a80" }}>Loading your cart…</p>
              </div>
            ) : items.length === 0 ? (
              /* Empty state */
              <div style={{ padding: isMobile ? 16 : 24, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#6c5a80" }}>Your cart is empty.</p>
                <div style={{ height: 10 }} />
                <Link
                  to="/shop"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 800,
                    background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                    boxShadow: "0 6px 16px rgba(102, 51, 153, .18)",
                  }}
                >
                  Browse the Shop
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid" }}>
                {items.map((it) => {
                  const linePrice = it.unitPrice * it.qty;
                  const lineCompare =
                    (typeof it.compareAt === "number" ? it.compareAt : it.unitPrice) * it.qty;

                  return (
                    <div
                      key={it.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "80px 1fr auto" : "120px 1fr auto",
                        gap: isMobile ? 10 : 14,
                        alignItems: "center",
                        padding: isMobile ? "10px 12px" : "14px 16px",
                        borderBottom: "1px solid #f2ecf7",
                      }}
                    >
                      {/* image */}
                      <Link
                        to={it.slug ? `/product/${it.slug}` : "/shop"}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "4/5",
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#f6f1fa",
                            border: "1px solid #eee7f2",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                // hide broken image, show fallback text
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                padding: 8,
                                textAlign: "center",
                                color: "#6b5a7a",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              No image
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* title + qty */}
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 800, fontSize: isMobile ? 13.5 : 15 }}>
                          {it.name}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => dec(it.id)} aria-label="Decrease" style={qtyBtnStyle}>
                            −
                          </button>

                          <div style={{ minWidth: 34, textAlign: "center", fontWeight: 700 }}>
                            {it.qty}
                          </div>

                          <button onClick={() => inc(it.id)} aria-label="Increase" style={qtyBtnStyle}>
                            +
                          </button>

                          <button
                            onClick={() => removeItem(it.id)}
                            style={{
                              marginLeft: 10,
                              border: "none",
                              background: "transparent",
                              color: "#a08fb6",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* line prices */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800 }}>{currency(linePrice)}</div>
                        {lineCompare > linePrice && (
                          <div style={{ color: "#9b8cab", textDecoration: "line-through", fontSize: 13 }}>
                            {currency(lineCompare)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Summary */}
          <aside
            style={{
              background: "#fff",
              border: "1px solid #e6e1ea",
              borderRadius: 14,
              padding: isMobile ? 12 : 16,
              position: "sticky",
              top: isMobile ? 10 : 90,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Order Summary</div>

            <div style={rowStyle}>
              <span>Subtotal</span>
              <span>{currency(totals.subtotal)}</span>
            </div>

            <div style={rowStyle}>
              <span>Shipping</span>
              <span>{totals.shipping ? currency(totals.shipping) : "Free"}</span>
            </div>

            {totals.savings > 0 && (
              <div style={{ ...rowStyle, color: "#2e7d32", fontWeight: 700 }}>
                <span>Savings</span>
                <span>−{currency(totals.savings)}</span>
              </div>
            )}

            <div style={{ height: 8, borderBottom: "1px dashed #e6e1ea", margin: "8px 0" }} />

            <div style={{ ...rowStyle, fontWeight: 900 }}>
              <span>Total</span>
              <span>{currency(totals.grand)}</span>
            </div>

            <div style={{ height: 12 }} />

            <Link
              to={items.length ? "/checkout" : "/shop"}
              style={{
                display: "grid",
                placeItems: "center",
                height: 48,
                borderRadius: 12,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 900,
                letterSpacing: 0.4,
                background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                opacity: items.length ? 1 : 0.6,
                pointerEvents: items.length ? "auto" : "none",
              }}
            >
              Proceed to checkout
            </Link>

            <div style={{ height: 10 }} />

            <Link
              to="/shop"
              style={{
                display: "inline-block",
                textDecoration: "none",
                color: colors.vividPurple,
                fontWeight: 800,
                textAlign: "center",
                width: "100%",
                padding: "8px 6px",
              }}
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* -------- Styles -------- */
const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 0",
  fontSize: 14,
};

const qtyBtnStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid #e6e1ea",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "28px",
};
