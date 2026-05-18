// frontend/src/sections/ContactSection.jsx
import React, { useState, useEffect } from "react";
import useBreakpoint from "../hooks/useBreakpoint";
import { shadows } from "../theme";

const PAGES_API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const DEFAULT_CONTACT = {
  title: "Contact",
  email: "hello@utopiabyrim.com",
  phone: "+961 70 000 000",
  whatsapp: "+961 70 000 000",
  address: "Beirut, Lebanon",
  note: "",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 14, color: "#4b3355", marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

export default function ContactSection() {
  const bp = useBreakpoint();
  const gold = "#d4af37";

  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  // ─── Fetch CMS contact content ────────────────────────────────────────────
  useEffect(() => {
    fetch(`${PAGES_API}/pages/contact`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setContact({ ...DEFAULT_CONTACT, ...data }))
      .catch(() => {}); // silently fall back to defaults
  }, []);

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill all fields.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSent(true);
  }

  // Build WhatsApp href from the stored number
  const waNumber = (contact.whatsapp || contact.phone || "")
    .replace(/\D/g, ""); // strip non-digits
  const waHref = waNumber ? `https://wa.me/${waNumber}` : "#";

  const emailHref = contact.email ? `mailto:${contact.email}` : "#";

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d9cfe1",
    outline: "none",
    fontSize: 15,
    transition: "border-color .2s ease, box-shadow .2s ease",
    boxSizing: "border-box",
  };

  const focusIn  = (e) => { e.currentTarget.style.border = `1px solid ${gold}`; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,175,55,.18)"; };
  const focusOut = (e) => { e.currentTarget.style.border = "1px solid #d9cfe1";  e.currentTarget.style.boxShadow = "none"; };

  return (
    <section
      id="contact"
      style={{
        background: "#987e9cff",
        padding: bp.xs || bp.sm ? "44px 16px 64px" : "70px 40px 90px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            margin: 0,
            fontFamily: "'Great Vibes', cursive",
            background: "linear-gradient(90deg, #d4af37, #f6d77e, #d4af37)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "clamp(38px, 6vw, 70px)",
            fontWeight: 400,
            letterSpacing: 2,
            backgroundSize: "200%",
            animation: "shine 4s linear infinite",
          }}
        >
          {contact.title || "Contact us"}
        </h2>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: bp.xs || bp.sm ? "1fr" : "1.1fr 1fr",
            gap: bp.xs ? 18 : 28,
            marginTop: 26,
          }}
        >
          {/* Left: contact info */}
          <div
            style={{
              background: "#c1a7cc",
              borderRadius: 20,
              padding: bp.xs ? 18 : 28,
              boxShadow: shadows.subtle,
              border: "1px solid rgba(212,175,55,.35)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                color: "#3d264b",
                fontSize: bp.xs ? 18 : 22,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              We'd love to hear from you
            </h3>

            <p style={{ margin: 0, color: "#4b3355", lineHeight: 1.7, textAlign: "center" }}>
              Custom orders, wholesale inquiries, or a simple hello —
              just reach out. We answer within 24 hours.
            </p>

            {contact.note ? (
              <p style={{ margin: "10px 0 0", color: "#4b3355", lineHeight: 1.6, textAlign: "center", fontSize: 13 }}>
                {contact.note}
              </p>
            ) : null}

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>

              {/* Email */}
              {contact.email && (
                <a
                  href={emailHref}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#ecdff2", padding: "12px 14px", borderRadius: 14,
                    textDecoration: "none", color: "#3d264b", fontWeight: 600,
                    border: "1px solid rgba(212,175,55,.35)",
                  }}
                >
                  <span aria-hidden>✉️</span> {contact.email}
                </a>
              )}

              {/* Phone */}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#ecdff2", padding: "12px 14px", borderRadius: 14,
                    textDecoration: "none", color: "#3d264b", fontWeight: 600,
                    border: "1px solid rgba(212,175,55,.35)",
                  }}
                >
                  <span aria-hidden>📞</span> {contact.phone}
                </a>
              )}

              {/* WhatsApp */}
              {contact.whatsapp && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#ecdff2", padding: "12px 14px", borderRadius: 14,
                    textDecoration: "none", color: "#3d264b", fontWeight: 600,
                    border: "1px solid rgba(212,175,55,.35)",
                  }}
                >
                  <span aria-hidden>💬</span> WhatsApp: {contact.whatsapp}
                </a>
              )}

              {/* Instagram placeholder */}
              <a
                href="https://instagram.com/utopia_by_rim"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#ecdff2", padding: "12px 14px", borderRadius: 14,
                  textDecoration: "none", color: "#3d264b", fontWeight: 600,
                  border: "1px solid rgba(212,175,55,.35)",
                }}
              >
                <span aria-hidden>📷</span> @utopia_by_rim
              </a>
            </div>

            {/* Address */}
            <div
              style={{
                marginTop: 18, borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(212,175,55,.35)",
                background: "linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.3))",
                height: 80, display: "grid", placeItems: "center",
                color: "#4b3355", fontWeight: 600,
              }}
            >
              {contact.address || "Beirut, Lebanon"}
            </div>
          </div>

          {/* Right: form */}
          <form
            onSubmit={onSubmit}
            style={{
              background: "#fff", borderRadius: 20, padding: bp.xs ? 18 : 28,
              border: "1px solid rgba(212,175,55,.35)", boxShadow: shadows.subtle,
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", color: "#3d264b", fontWeight: 700, padding: "20px 8px" }}>
                🎉 Thank you! Your message has been sent.
              </div>
            ) : (
              <>
                <Field label="Your name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Rim / Dana"
                    required
                    style={inputStyle}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    style={inputStyle}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </Field>

                <Field label="Message">
                  <textarea
                    rows={bp.xs || bp.sm ? 4 : 5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us about your custom idea…"
                    required
                    style={{ ...inputStyle, resize: "vertical" }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </Field>

                {error && (
                  <div style={{ color: "#b40030", fontSize: 14, marginTop: 6 }}>{error}</div>
                )}

                <button
                  type="submit"
                  style={{
                    marginTop: 14, width: "100%",
                    background: "linear-gradient(90deg, #d4af37, #f6d77e)",
                    color: "#fff", border: "none", padding: "12px 18px",
                    borderRadius: 14, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(212,175,55,.28)",
                    transition: "transform .2s ease, opacity .2s ease",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Send message
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}