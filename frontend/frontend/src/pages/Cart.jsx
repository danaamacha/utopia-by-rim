// frontend/src/pages/Cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";

/* ---------------- Local storage helpers ---------------- */
const LS_KEY = "cart_v1";

function readCart() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    // guard
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && x.id && x.name && typeof x.price === "number")
      .map((x) => ({ ...x, qty: Math.max(1, Number(x.qty || 1)) }));
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function currency(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

/* ---------------- Cart page ---------------- */
export default function Cart() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const navigate = useNavigate();

  const [items, setItems] = useState(() => readCart());

  // Keep in sync with other tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_KEY) setItems(readCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist on change
  useEffect(() => {
    writeCart(items);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const compareSubtotal = items.reduce(
      (s, it) => s + (typeof it.compareAt === "number" ? it.compareAt : it.price) * it.qty,
      0
    );
    const savings = Math.max(0, compareSubtotal - subtotal);
    const shipping = items.length ? 0 : 0; // FREE for now
    const grand = subtotal + shipping;
    return { subtotal, savings, shipping, grand };
  }, [items]);

  const inc = (id) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  };
  const dec = (id) => {
    setItems((arr) =>
      arr
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
        .filter(Boolean)
    );
  };
  const removeItem = (id) => setItems((arr) => arr.filter((it) => it.id !== id));
  const clear = () => setItems([]);

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
      <section style={{ background: "#faf9fb", padding: isMobile ? "14px 10px 70px" : "36px 20px 90px" }}>
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
                Cart ({items.reduce((s, it) => s + it.qty, 0)} item
                {items.reduce((s, it) => s + it.qty, 0) !== 1 ? "s" : ""})
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

            {/* Empty state */}
            {items.length === 0 ? (
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
                  const linePrice = it.price * it.qty;
                  const lineCompare =
                    (typeof it.compareAt === "number" ? it.compareAt : it.price) * it.qty;

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
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "4/5",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#f6f1fa",
                          border: "1px solid #eee7f2",
                        }}
                      >
                        <img
                          src={it.image}
                          alt={it.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>

                      {/* title + price + qty */}
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 800, fontSize: isMobile ? 13.5 : 15 }}>{it.name}</div>

                        {/* Qty control */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => dec(it.id)}
                            aria-label="Decrease"
                            style={qtyBtnStyle}
                          >
                            −
                          </button>
                          <div style={{ minWidth: 34, textAlign: "center", fontWeight: 700 }}>{it.qty}</div>
                          <button
                            onClick={() => inc(it.id)}
                            aria-label="Increase"
                            style={qtyBtnStyle}
                          >
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

            <Link to="/checkout" style={{
  display:"grid", placeItems:"center", height:48, borderRadius:12,
  color:"#fff", textDecoration:"none", fontWeight:900, letterSpacing:.4,
  background:`linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`
}}>
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
