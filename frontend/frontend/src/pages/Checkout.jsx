import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";

/** --------- Utilities ---------- */
function readCart() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function formatMoney(v) {
  return `$${v.toFixed(2)}`;
}

const DEMO_CART = [
  { id: "p1", name: "Agate Clock", price: 56, compareAt: 70, qty: 1, image: "/best/best1.jpg", size: "M" },
  { id: "p3", name: "Forest Coasters", price: 42, qty: 2, image: "/best/best5.jpg", size: "S" },
];

export default function Checkout() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => readCart() || DEMO_CART);

  // Contact + Address
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [country, setCountry] = useState("Lebanon");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");

  // Delivery + Payment
  const [shipping, setShipping] = useState("standard"); // standard | express
  const [payment, setPayment] = useState("cod"); // cod | card

  // Promo code
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(null); // { code, percent } or null
  const [promoMsg, setPromoMsg] = useState("");

  // simple validation flags
  const [errors, setErrors] = useState({});

  // Summary math
  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.price * (it.qty || 1), 0),
    [cart]
  );
  const compareSum = useMemo(
    () => cart.reduce((sum, it) => sum + (it.compareAt || it.price) * (it.qty || 1), 0),
    [cart]
  );
  const discountFromCompare = Math.max(0, compareSum - subtotal);

  const shippingCost = shipping === "express" ? 12 : 6; // simple flat-rate demo
  const promoDiscount = promoApplied ? (subtotal * promoApplied.percent) / 100 : 0;
  const total = Math.max(0, subtotal - promoDiscount) + shippingCost;

  /** Apply a simple demo promo: "UTOPIA10" → 10% off */
  function applyPromo() {
    const code = promo.trim().toUpperCase();
    if (!code) {
      setPromoMsg("Enter a promo code.");
      setPromoApplied(null);
      return;
    }
    if (code === "UTOPIA10") {
      setPromoApplied({ code, percent: 10 });
      setPromoMsg("Promo applied: 10% off.");
    } else {
      setPromoApplied(null);
      setPromoMsg("Invalid or expired code.");
    }
  }

  function updateQty(id, qty) {
    setCart((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it))
        .filter(Boolean)
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((it) => it.id !== id));
  }

  useEffect(() => {
    // persist to localStorage so the cart survives reloads
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  function validate() {
    const e = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email = "Valid email required";
    if (!phone || phone.replace(/\D/g, "").length < 6) e.phone = "Valid phone required";
    if (!first) e.first = "First name required";
    if (!last) e.last = "Last name required";
    if (!city) e.city = "City required";
    if (!address) e.address = "Address required";
    if (country === "Lebanon" && !zip) e.zip = "Postal/ZIP required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function placeOrder() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ----- NEW: snapshot + order confirmation navigation -----
    const orderId = Math.random().toString(16).slice(2, 8).toUpperCase();
    const snapshot = {
      orderId: `UTP-${orderId}`,
      email,
      shipping,
      promo: promoApplied, // { code, percent } or null
      items: cart.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        compareAt: it.compareAt,
        image: it.image,
        qty: it.qty || 1,
        size: it.size,
      })),
    };

    try {
      localStorage.setItem("last_order", JSON.stringify(snapshot));
    } catch (_) {}

    try {
      localStorage.removeItem("cart");
    } catch (_) {}

    navigate("/order-confirmation", { state: snapshot });
  }

  return (
    <main style={{ minWidth: 0 }}>
      {/* Banner */}
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
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1200 }}>
          <div style={{ opacity: 0.9, fontSize: isMobile ? 12 : 13, textAlign: "left" }}>
            <Link to="/" style={{ color: "#fff" }}>Home</Link> <span style={{ opacity:.8 }}>/</span>{" "}
            <Link to="/cart" style={{ color: "#fff" }}>Cart</Link> <span style={{ opacity:.8 }}>/</span>{" "}
            <span style={{ opacity: .9 }}>Checkout</span>
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: isMobile ? 22 : 34, lineHeight: 1.15 }}>
            Checkout
          </h1>
        </div>
      </section>

      {/* Grid layout */}
      <section
        style={{
          background: "#faf9fb",
          padding: isMobile ? "14px 12px 70px" : "28px 20px 90px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.1fr) minmax(0,.9fr)",
            gap: isMobile ? 14 : 24,
            alignItems: "start",
            minWidth: 0,
          }}
        >
          {/* LEFT: forms */}
          <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
            <Card title="Contact information">
              <Grid two={!isMobile}>
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={errors.email}
                  type="email"
                  autoComplete="email"
                />
                <Field
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+961 ..."
                  error={errors.phone}
                  type="tel"
                  autoComplete="tel"
                />
              </Grid>
            </Card>

            <Card title="Shipping address">
              <Grid two={!isMobile}>
                <Field label="First name" value={first} onChange={setFirst} error={errors.first} autoComplete="given-name" />
                <Field label="Last name" value={last} onChange={setLast} error={errors.last} autoComplete="family-name" />
              </Grid>

              <Grid two={!isMobile}>
                <Select
                  label="Country/Region"
                  value={country}
                  onChange={setCountry}
                  options={["Lebanon", "Qatar", "UAE", "KSA", "Jordan", "Egypt"]}
                />
                <Field label="City" value={city} onChange={setCity} error={errors.city} autoComplete="address-level2" />
              </Grid>

              <Field label="Address" value={address} onChange={setAddress} error={errors.address} autoComplete="street-address" />
              <Grid two={!isMobile}>
                <Field label="Postal / ZIP" value={zip} onChange={setZip} error={errors.zip} autoComplete="postal-code" inputMode="numeric" />
                <div />
              </Grid>
            </Card>

            <Card title="Delivery method">
              <RadioRow
                name="shipping"
                options={[
                  { value: "standard", label: "Standard (3–5 days)", meta: "+ $6.00" },
                  { value: "express",  label: "Express (1–2 days)",  meta: "+ $12.00" },
                ]}
                value={shipping}
                onChange={setShipping}
              />
            </Card>

            <Card title="Payment">
              <RadioRow
                name="payment"
                options={[
                  { value: "cod",  label: "Cash on delivery" },
                  { value: "card", label: "Credit / Debit card (not charged in demo)" },
                ]}
                value={payment}
                onChange={setPayment}
              />
              {payment === "card" && (
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <Grid two={!isMobile}>
                    <Field label="Card number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
                    <Field label="Name on card" placeholder="Your Name" />
                  </Grid>
                  <Grid two={!isMobile}>
                    <Field label="Expiry (MM/YY)" placeholder="12/27" />
                    <Field label="CVC" placeholder="123" inputMode="numeric" />
                  </Grid>
                </div>
              )}
            </Card>

            <div style={{ display: "grid", gap: 10 }}>
              <button
                onClick={placeOrder}
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
                  fontWeight: 900,
                  letterSpacing: .4,
                  background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                  boxShadow: "0 10px 22px rgba(102,51,153,.18)",
                }}
              >
                Place order
              </button>
              <Link
                to="/cart"
                style={{
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 12,
                  border: "1px solid #e6e1ea",
                  color: colors.vividPurple,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Back to cart
              </Link>
            </div>
          </div>

          {/* RIGHT: order summary */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #ece5f2",
                borderRadius: 16,
                padding: isMobile ? 12 : 16,
                display: "grid",
                gap: 12,
                position: "sticky",
                top: isMobile ? 8 : 90,
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16 }}>Order summary</div>

              {/* Items */}
              <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                {cart.length === 0 ? (
                  <div style={{ color: "#6a5680", fontSize: 14 }}>
                    Your cart is empty. <Link to="/shop" style={{ color: colors.vividPurple }}>Browse products</Link>
                  </div>
                ) : (
                  cart.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "64px 1fr auto",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#f7f3fa",
                          border: "1px solid #efe7f6",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={it.image}
                          alt={it.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {it.name} {it.size ? `• ${it.size}` : ""}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 900, color: colors.vividPurple }}>{formatMoney(it.price)}</span>
                          {typeof it.compareAt === "number" && it.compareAt > it.price && (
                            <span style={{ color: "#9b8cab", textDecoration: "line-through", fontSize: 13 }}>
                              {formatMoney(it.compareAt)}
                            </span>
                          )}
                        </div>

                        {/* qty controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => updateQty(it.id, (it.qty || 1) - 1)}
                            style={qtyBtn}
                            aria-label="Decrease quantity"
                          >
                            –
                          </button>
                          <div style={{ minWidth: 30, textAlign: "center", fontWeight: 800 }}>{it.qty || 1}</div>
                          <button
                            onClick={() => updateQty(it.id, (it.qty || 1) + 1)}
                            style={qtyBtn}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(it.id)}
                            style={{ marginLeft: 8, ...linkBtn }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{formatMoney((it.qty || 1) * it.price)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={applyPromo} style={secondaryBtn}>
                  Apply
                </button>
              </div>
              {promoMsg && (
                <div style={{ fontSize: 12.5, color: promoApplied ? "#1a7f37" : "#a42323" }}>{promoMsg}</div>
              )}

              {/* Totals */}
              <div style={{ borderTop: "1px solid #f0e9f6", paddingTop: 8, display: "grid", gap: 6 }}>
                <Row label="Subtotal" value={formatMoney(subtotal)} />
                {discountFromCompare > 0 && <Row label="Sale savings" value={`- ${formatMoney(discountFromCompare)}`} />}
                {promoApplied && <Row label={`Promo (${promoApplied.code})`} value={`- ${formatMoney(promoDiscount)}`} />}
                <Row label={`Shipping (${shipping === "express" ? "Express" : "Standard"})`} value={formatMoney(shippingCost)} />
                <div style={{ height: 1, background: "#f0e9f6", margin: "4px 0" }} />
                <Row bold large label="Total" value={formatMoney(total)} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/** ---------- Small UI helpers ---------- */
function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ece5f2",
        borderRadius: 16,
        padding: 14,
        boxSizing: "border-box",
        minWidth: 0,
        width: "100%",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Grid({ two, children }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: two ? "minmax(0,1fr) minmax(0,1fr)" : "1fr",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, error, type = "text", autoComplete, inputMode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        style={{
          ...inputStyle,
          border: `1px solid ${error ? "#d55" : "#d9d2df"}`,
        }}
      />
      {error && <div style={{ color: "#a42323", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage:
            "linear-gradient(45deg, transparent 50%, #a093b3 50%), linear-gradient(135deg, #a093b3 50%, transparent 50%)",
          backgroundPosition: "calc(100% - 18px) 16px, calc(100% - 12px) 16px",
          backgroundSize: "6px 6px, 6px 6px",
          backgroundRepeat: "no-repeat",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function RadioRow({ name, options, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #e6e1ea",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            background: value === opt.value ? "#efe7f6" : "#fff",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <div style={{ fontWeight: 700 }}>{opt.label}</div>
          </div>
          {opt.meta && <div style={{ color: colors.vividPurple, fontWeight: 800, whiteSpace: "nowrap" }}>{opt.meta}</div>}
        </label>
      ))}
    </div>
  );
}

function Row({ label, value, bold, large }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", minWidth: 0 }}>
      <div style={{ fontWeight: bold ? 900 : 700, fontSize: large ? 16 : 14 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: large ? 18 : 14 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #d9d2df",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 14,
  minHeight: 42,
};

const secondaryBtn = {
  borderRadius: 10,
  border: "1px solid #e6e1ea",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  padding: "10px 14px",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: colors.vividPurple,
  fontWeight: 800,
  cursor: "pointer",
};

const qtyBtn = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #e6e1ea",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  lineHeight: "26px",
};
