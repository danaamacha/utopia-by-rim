import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";
import { checkout as apiCheckout } from "../api/orders";
import { useAuth } from "../auth/AuthContext";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../api/cart";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

function formatMoney(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function Checkout() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [country, setCountry] = useState("Lebanon");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");

  const [shipping, setShipping] = useState("standard");
  const [payment, setPayment] = useState("cod");

  // Promo — now wired to API
  const [promo, setPromo] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoApplied, setPromoApplied] = useState(null); // { code, discountAmount, finalTotal, type, freeShipping }
  const [promoMsg, setPromoMsg] = useState("");

  const [errors, setErrors] = useState({});

  const loadBackendCart = async () => {
    if (!isAuthenticated) { setCart([]); setCartLoading(false); return; }
    try {
      setCartLoading(true);
      const c = await getCart();
      const normalized = (c?.items || []).map((it) => ({
        id: it.id,
        qty: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || it.product?.price || 0),
        productId: it.product?.id,
        slug: it.product?.slug,
        name: it.product?.name || "Product",
        image:
          it.product?.images?.find((img) => img.isPrimary)?.url ||
          it.product?.images?.[0]?.url ||
          "/best/best1.jpg",
        compareAt: null,
        size: null,
      }));
      setCart(normalized);
    } catch (e) {
      console.error("Failed to load backend cart:", e);
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadBackendCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ─── Apply promo via API ───────────────────────────────────────────────────
  async function applyPromo() {
    const code = promo.trim().toUpperCase();
    if (!code) { setPromoMsg("Enter a promo code."); setPromoApplied(null); return; }

    // Compute subtotal fresh from cart at call time — avoids stale closure
    const currentSubtotal = cart.reduce((sum, it) => sum + it.unitPrice * (it.qty || 1), 0);
    if (currentSubtotal <= 0) { setPromoMsg("Add items to your cart first."); return; }

    setPromoApplying(true);
    setPromoMsg("");
    try {
      const res = await fetch(`${API_BASE}/discounts/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ code, total: currentSubtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoApplied(null);
        setPromoMsg(data.message || "Invalid or expired code.");
        return;
      }

      setPromoApplied(data); // { discountId, code, type, discountAmount, finalTotal, freeShipping }
      const msg = data.freeShipping
        ? `Free shipping applied!`
        : `Promo applied: -${formatMoney(data.discountAmount)} off.`;
      setPromoMsg(msg);
    } catch {
      setPromoApplied(null);
      setPromoMsg("Failed to validate code. Try again.");
    } finally {
      setPromoApplying(false);
    }
  }

  // Remove promo
  function removePromo() {
    setPromoApplied(null);
    setPromo("");
    setPromoMsg("");
  }

  async function updateQty(cartItemId, qty) {
    const next = Math.max(1, Number(qty || 1));
    setCart((prev) => prev.map((it) => (it.id === cartItemId ? { ...it, qty: next } : it)));
    try {
      await updateCartItem(cartItemId, next);
    } catch (e) {
      console.error("Failed to update qty:", e);
      alert(e?.message || "Failed to update quantity");
      loadBackendCart();
    }
  }

  async function removeItem(cartItemId) {
    const prev = cart;
    setCart((p) => p.filter((it) => it.id !== cartItemId));
    try {
      await removeCartItem(cartItemId);
    } catch (e) {
      console.error("Failed to remove item:", e);
      alert(e?.message || "Failed to remove item");
      setCart(prev);
    }
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.unitPrice * (it.qty || 1), 0),
    [cart]
  );

  const compareSum = useMemo(
    () => cart.reduce((sum, it) => sum + (typeof it.compareAt === "number" ? it.compareAt : it.unitPrice) * (it.qty || 1), 0),
    [cart]
  );

  const discountFromCompare = Math.max(0, compareSum - subtotal);
  const shippingCost = promoApplied?.freeShipping ? 0 : (shipping === "express" ? 12 : 6);
  const promoDiscount = promoApplied ? Number(promoApplied.discountAmount || 0) : 0;
  const total = Math.max(0, subtotal - promoDiscount) + shippingCost;

  function validate() {
    const e = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email = "Valid email required";
    if (!phone || phone.replace(/\D/g, "").length < 6) e.phone = "Valid phone required";
    if (!first) e.first = "First name required";
    if (!last) e.last = "Last name required";
    if (!city) e.city = "City required";
    if (!address) e.address = "Address required";
    if (country !== "Lebanon" && !zip) e.zip = "Postal/ZIP required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!isAuthenticated) { alert("Please login first."); navigate("/login"); return; }
    if (cart.length === 0) { alert("Your cart is empty."); return; }
    if (!validate()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    let apiNotification = null;
    let apiOrderId = null;

    try {
      const fullName = `${first} ${last}`.trim();
      const response = await apiCheckout({
        fullName,
        email,
        phone,
        addressLine1: address,
        addressLine2: "",
        city,
        state: city || country,
        country,
        postalCode: zip || "00000",
        paymentMethod: payment === "card" ? "MANUAL" : "COD",
        discountCode: promoApplied?.code ?? undefined, // ← send to backend
      });

      apiNotification = response?.notification || null;
      apiOrderId = response?.order?.id || null;
    } catch (err) {
      alert(err?.message || "Checkout failed");
      return;
    }

    const orderId = Math.random().toString(16).slice(2, 8).toUpperCase();
    const snapshot = {
      orderId: apiOrderId || `UTP-${orderId}`,
      email,
      shipping,
      promo: promoApplied,
      notification: apiNotification,
      items: cart.map((it) => ({
        id: it.productId || it.id,
        name: it.name,
        price: it.unitPrice,
        compareAt: it.compareAt,
        image: it.image,
        qty: it.qty || 1,
        size: it.size,
      })),
    };

    try { localStorage.setItem("last_order", JSON.stringify(snapshot)); } catch (_) {}

    try { await clearCart(); } catch (e) { console.warn("Order done but failed to clear cart:", e); }

    navigate("/order-confirmation", { state: snapshot });
  }

  return (
    <main style={{ minWidth: 0 }}>
      {/* Banner */}
      <section style={{
        background: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url(/hero.jpeg) center/cover no-repeat`,
        color: "#fff", minHeight: isMobile ? 140 : 200, display: "grid", placeItems: "center",
        textAlign: "center", paddingTop: "clamp(84px, 14vw, 120px)",
        paddingBottom: isMobile ? 14 : 24, paddingInline: 12, boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", maxWidth: 1200 }}>
          <div style={{ opacity: 0.9, fontSize: isMobile ? 12 : 13, textAlign: "left" }}>
            <Link to="/" style={{ color: "#fff" }}>Home</Link> <span style={{ opacity:.8 }}>/</span>{" "}
            <Link to="/cart" style={{ color: "#fff" }}>Cart</Link> <span style={{ opacity:.8 }}>/</span>{" "}
            <span style={{ opacity: .9 }}>Checkout</span>
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: isMobile ? 22 : 34, lineHeight: 1.15 }}>Checkout</h1>
        </div>
      </section>

      {/* Grid layout */}
      <section style={{ background: "#faf9fb", padding: isMobile ? "14px 12px 70px" : "28px 20px 90px", boxSizing: "border-box" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.1fr) minmax(0,.9fr)",
          gap: isMobile ? 14 : 24, alignItems: "start", minWidth: 0,
        }}>
          {/* LEFT */}
          <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
            <Card title="Contact information">
              <Grid two={!isMobile}>
                <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} type="email" autoComplete="email" />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="+961 ..." error={errors.phone} type="tel" autoComplete="tel" />
              </Grid>
            </Card>

            <Card title="Shipping address">
              <Grid two={!isMobile}>
                <Field label="First name" value={first} onChange={setFirst} error={errors.first} autoComplete="given-name" />
                <Field label="Last name" value={last} onChange={setLast} error={errors.last} autoComplete="family-name" />
              </Grid>
              <Grid two={!isMobile}>
                <Select label="Country/Region" value={country} onChange={setCountry} options={["Lebanon", "Qatar", "UAE", "KSA", "Jordan", "Egypt"]} />
                <Field label="City" value={city} onChange={setCity} error={errors.city} autoComplete="address-level2" />
              </Grid>
              <Field label="Address" value={address} onChange={setAddress} error={errors.address} autoComplete="street-address" />
              <Grid two={!isMobile}>
                <Field label="Postal / ZIP" value={zip} onChange={setZip} error={errors.zip} autoComplete="postal-code" inputMode="numeric" />
                <div />
              </Grid>
            </Card>

            <Card title="Delivery method">
              <RadioRow name="shipping" options={[
                { value: "standard", label: "Standard (3–5 days)", meta: "+ $6.00" },
                { value: "express",  label: "Express (1–2 days)",  meta: "+ $12.00" },
              ]} value={shipping} onChange={setShipping} />
            </Card>

            <Card title="Payment">
              <RadioRow name="payment" options={[
                { value: "cod",  label: "Cash on delivery" },
                { value: "card", label: "Credit / Debit card (not charged in demo)" },
              ]} value={payment} onChange={setPayment} />
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
              <button onClick={placeOrder} disabled={cartLoading} style={{
                height: 48, borderRadius: 12, border: "none", cursor: "pointer",
                color: "#fff", fontWeight: 900, letterSpacing: .4,
                background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                boxShadow: "0 10px 22px rgba(102,51,153,.18)", opacity: cartLoading ? 0.7 : 1,
              }}>
                {cartLoading ? "Loading cart..." : "Place order"}
              </button>
              <Link to="/cart" style={{
                height: 46, display: "grid", placeItems: "center", borderRadius: 12,
                border: "1px solid #e6e1ea", color: colors.vividPurple,
                textDecoration: "none", fontWeight: 700,
              }}>
                Back to cart
              </Link>
            </div>
          </div>

          {/* RIGHT: summary */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: "#fff", border: "1px solid #ece5f2", borderRadius: 16,
              padding: isMobile ? 12 : 16, display: "grid", gap: 12,
              position: "sticky", top: isMobile ? 8 : 90,
              boxSizing: "border-box", opacity: cartLoading ? 0.8 : 1,
            }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Order summary</div>

              {/* Items */}
              <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                {cartLoading ? (
                  <div style={{ color: "#6a5680", fontSize: 14 }}>Loading cart…</div>
                ) : cart.length === 0 ? (
                  <div style={{ color: "#6a5680", fontSize: 14 }}>
                    Your cart is empty.{" "}
                    <Link to="/shop" style={{ color: colors.vividPurple }}>Browse products</Link>
                  </div>
                ) : (
                  cart.map((it) => (
                    <div key={it.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "#f7f3fa", border: "1px solid #efe7f6", flexShrink: 0 }}>
                        <img src={it.image} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {it.name} {it.size ? `• ${it.size}` : ""}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 900, color: colors.vividPurple }}>{formatMoney(it.unitPrice)}</span>
                          {typeof it.compareAt === "number" && it.compareAt > it.unitPrice && (
                            <span style={{ color: "#9b8cab", textDecoration: "line-through", fontSize: 13 }}>{formatMoney(it.compareAt)}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)} style={qtyBtn} aria-label="Decrease">–</button>
                          <div style={{ minWidth: 30, textAlign: "center", fontWeight: 800 }}>{it.qty || 1}</div>
                          <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)} style={qtyBtn} aria-label="Increase">+</button>
                          <button onClick={() => removeItem(it.id)} style={{ marginLeft: 8, ...linkBtn }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{formatMoney((it.qty || 1) * it.unitPrice)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo */}
              {!promoApplied ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      style={inputStyle}
                    />
                    <button onClick={applyPromo} disabled={promoApplying} style={secondaryBtn}>
                      {promoApplying ? "…" : "Apply"}
                    </button>
                  </div>
                  {promoMsg && (
                    <div style={{ fontSize: 12.5, color: "#a42323" }}>{promoMsg}</div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ fontSize: 13, color: "#2e7d32", fontWeight: 700 }}>
                    ✓ {promoApplied.code} — {promoApplied.freeShipping ? "Free shipping" : `-${formatMoney(promoApplied.discountAmount)}`}
                  </div>
                  <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6989", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              )}

              {/* Totals */}
              <div style={{ borderTop: "1px solid #f0e9f6", paddingTop: 8, display: "grid", gap: 6 }}>
                <Row label="Subtotal" value={formatMoney(subtotal)} />
                {discountFromCompare > 0 && <Row label="Sale savings" value={`- ${formatMoney(discountFromCompare)}`} />}
                {promoApplied && !promoApplied.freeShipping && <Row label={`Promo (${promoApplied.code})`} value={`- ${formatMoney(promoDiscount)}`} />}
                <Row label={`Shipping (${promoApplied?.freeShipping ? "Free" : shipping === "express" ? "Express" : "Standard"})`} value={formatMoney(shippingCost)} />
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

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ece5f2", borderRadius: 16, padding: 14, boxSizing: "border-box", minWidth: 0, width: "100%" }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Grid({ two, children }) {
  return (
    <div style={{ display: "grid", gap: 10, gridTemplateColumns: two ? "minmax(0,1fr) minmax(0,1fr)" : "1fr", minWidth: 0 }}>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, error, type = "text", autoComplete, inputMode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} inputMode={inputMode}
        style={{ ...inputStyle, border: `1px solid ${error ? "#d55" : "#d9d2df"}` }} />
      {error && <div style={{ color: "#a42323", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none",
        backgroundImage: "linear-gradient(45deg, transparent 50%, #a093b3 50%), linear-gradient(135deg, #a093b3 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 18px) 16px, calc(100% - 12px) 16px", backgroundSize: "6px 6px, 6px 6px", backgroundRepeat: "no-repeat" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function RadioRow({ name, options, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {options.map((opt) => (
        <label key={opt.value} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e6e1ea", borderRadius: 12, padding: "10px 12px", cursor: "pointer", background: value === opt.value ? "#efe7f6" : "#fff", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="radio" name={name} checked={value === opt.value} onChange={() => onChange(opt.value)} />
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

const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #d9d2df", background: "#fff", outline: "none", boxSizing: "border-box", fontSize: 14, minHeight: 42 };
const secondaryBtn = { borderRadius: 10, border: "1px solid #e6e1ea", background: "#fff", cursor: "pointer", fontWeight: 800, padding: "10px 14px" };
const linkBtn = { background: "transparent", border: "none", color: colors.vividPurple, fontWeight: 800, cursor: "pointer" };
const qtyBtn = { width: 28, height: 28, borderRadius: 8, border: "1px solid #e6e1ea", background: "#fff", fontWeight: 900, cursor: "pointer", lineHeight: "26px" };