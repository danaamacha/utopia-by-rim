import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";

/* ---------------- helpers ---------------- */
function maskEmail(e) {
  if (!e || !e.includes("@")) return "—";
  const [u, d] = e.split("@");
  const short = u.length <= 2 ? u[0] : u.slice(0, 2);
  return `${short}***@${d}`;
}
function fmt(n) {
  return `$${(+n || 0).toFixed(2)}`;
}
function formatDate(dt = new Date()) {
  return dt.toLocaleString();
}
function genOrderId() {
  // short friendly code like UTP-5F9C2A
  const r = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `UTP-${r}`;
}
function readLastOrder() {
  try {
    const raw = localStorage.getItem("last_order");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/* ---------- tiny UI helpers ---------- */
function Row({ label, value, bold, large }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontWeight: bold ? 900 : 700, fontSize: large ? 16 : 14 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: large ? 18 : 14 }}>{value}</div>
    </div>
  );
}

export default function OrderConfirmation() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const loc = useLocation();
  const nav = useNavigate();

  // Preferred data path from Checkout
  const st = (loc && loc.state) || {};
  const query = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const queryId = query.get("id");

  const lastOrder = useMemo(() => readLastOrder(), []);
  const orderId =
    st.orderId ||
    queryId ||
    (lastOrder && lastOrder.orderId) ||
    genOrderId();

  const items = st.items || (lastOrder && lastOrder.items) || [];
  const email = st.email || (lastOrder && lastOrder.email) || "";
  const notification =
    st.notification || (lastOrder && lastOrder.notification) || null;
  const shipping = st.shipping || (lastOrder && lastOrder.shipping) || "standard";
  const shippingCost = shipping === "express" ? 12 : 6;

  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
  const compareSum = items.reduce((s, it) => s + ((it.compareAt ?? it.price) || 0) * (it.qty || 1), 0);
  const saleDiscount = Math.max(0, compareSum - subtotal);
  const promo = st.promo || (lastOrder && lastOrder.promo) || null;
  const promoDiscount = promo ? (subtotal * (promo.percent || 0)) / 100 : 0;
  const total = Math.max(0, subtotal - promoDiscount) + shippingCost;

  // If user lands directly without anything, gently push them to shop after a short view.
  useEffect(() => {
    if (!items.length) {
      const t = setTimeout(() => nav("/shop", { replace: true }), 5000);
      return () => clearTimeout(t);
    }
  }, [items.length, nav]);

  /* ----- modernized styles ----- */
  const shell = {
    maxWidth: 960,
    margin: "0 auto",
    padding: isMobile ? 10 : 14,
    borderRadius: 22,
    background: "linear-gradient(135deg, #efe7f6, #e6f0ff)", // gradient hairline
    boxShadow: "0 16px 40px rgba(44, 20, 69, 0.12)",
  };
  const card = {
    background: "#fff",
    borderRadius: 20,
    padding: isMobile ? 14 : 18,
    display: "grid",
    gap: isMobile ? 12 : 16,
    border: "1px solid #f1ecf6",
  };

  const btnBase = {
    display: "grid",
    placeItems: "center",
    height: 46,
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 800,
    transition: "transform .08s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
  };
  const btnPrimary = {
    ...btnBase,
    color: "#fff",
    border: "none",
    background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
    boxShadow: "0 10px 22px rgba(102,51,153,.18)",
  };
  const btnPrimaryHover = {
    transform: "translateY(-1px)",
    boxShadow: "0 14px 28px rgba(102,51,153,.24)",
  };
  const btnSecondary = {
    ...btnBase,
    color: colors.vividPurple,
    background: "#fff",
    border: "1px solid #e6e1ea",
  };
  const btnSecondaryHover = {
    transform: "translateY(-1px)",
    boxShadow: "0 10px 18px rgba(44,20,69,.08)",
    borderColor: "#dacfee",
  };

  return (
    <main>
      {/* hero */}
      <section
        style={{
          background:
            `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url(/hero.jpeg) center/cover no-repeat`,
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
          <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 36, lineHeight: 1.15 }}>Thank you for your order!</h1>
          <div style={{ marginTop: 6, opacity: .95, fontSize: isMobile ? 12.5 : 14.5 }}>
            We've sent a confirmation to <strong>{maskEmail(email)}</strong>
          </div>
          {notification?.emailSent === true && (
            <div style={{ marginTop: 8, fontSize: isMobile ? 12.5 : 14.5, color: "#e8f5e9" }}>
              Confirmation email sent.
            </div>
          )}
          {notification && notification.emailSent === false && (
            <div style={{ marginTop: 8, fontSize: isMobile ? 12.5 : 14.5, color: "#ffecb3" }}>
              We could not send the confirmation email. Please check your spam folder or contact support.
            </div>
          )}
        </div>
      </section>

      {/* confirmation card (modern shell + card) */}
      <section style={{ background: "#faf9fb", padding: isMobile ? "14px 12px 70px" : "28px 20px 90px" }}>
        <div style={shell}>
          <div style={card}>
            {/* header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* success icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  boxShadow: "0 12px 24px rgba(102,51,153,.18)",
                  justifySelf: isMobile ? "center" : "start",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ textAlign: isMobile ? "center" : "left" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Order confirmed</div>
                <div style={{ color: "#6a5680", fontSize: 13 }}>
                  Placed on {formatDate()}
                </div>
              </div>

              <div
                style={{
                  justifySelf: isMobile ? "center" : "end",
                  fontWeight: 900,
                  fontSize: isMobile ? 14 : 16,
                  color: colors.vividPurple,
                  background: "#f6f1ff",
                  border: "1px solid #efe7f6",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                #{orderId}
              </div>
            </div>

            {/* items */}
            <div
              style={{
                borderTop: "1px solid #f0e9f6",
                paddingTop: 10,
                display: "grid",
                gap: 10,
              }}
            >
              {items.length === 0 ? (
                <div style={{ color: "#6a5680", fontSize: 14 }}>
                  No items found for this order. You will be redirected to the shop shortly.
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "72px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#f7f3fa",
                        border: "1px solid #efe7f6",
                      }}
                    >
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {it.name} {it.size ? `• ${it.size}` : ""}
                      </div>
                      <div style={{ color: "#6a5680", fontSize: 13, marginTop: 2 }}>
                        Qty: {it.qty || 1}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{fmt((it.qty || 1) * (it.price || 0))}</div>
                  </div>
                ))
              )}
            </div>

            {/* totals */}
            <div
              style={{
                borderTop: "1px solid #f0e9f6",
                paddingTop: 10,
                display: "grid",
                gap: 6,
                maxWidth: 480,
                justifySelf: isMobile ? "stretch" : "end",
                width: "100%",
                background: "#fff",
                borderRadius: 14,
              }}
            >
              <Row label="Subtotal" value={fmt(subtotal)} />
              {saleDiscount > 0 && <Row label="Sale savings" value={`- ${fmt(saleDiscount)}`} />}
              {promo && <Row label={`Promo (${promo.code})`} value={`- ${fmt(promoDiscount)}`} />}
              <Row label={`Shipping (${shipping === "express" ? "Express" : "Standard"})`} value={fmt(shippingCost)} />
              <div style={{ height: 1, background: "#f0e9f6", margin: "4px 0" }} />
              <Row bold large label="Total paid" value={fmt(total)} />
            </div>

            {/* actions */}
            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: isMobile ? "1fr" : "auto auto",
                justifyContent: isMobile ? "stretch" : "end",
              }}
            >
              {/* Secondary */}
              <Link
                to="/shop"
                style={btnSecondary}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnSecondaryHover)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = btnSecondary.boxShadow || "none";
                  e.currentTarget.style.borderColor = "#e6e1ea";
                }}
              >
                Continue shopping
              </Link>

              {/* Primary */}
              <Link
                to="/"
                style={btnPrimary}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnPrimaryHover)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = btnPrimary.boxShadow;
                }}
              >
                Go to homepage
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
