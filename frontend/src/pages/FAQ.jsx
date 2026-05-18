// frontend/src/pages/FAQ.jsx
import React, { useMemo, useState, useEffect } from "react";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";

const PAGES_API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── DEFAULT content (shown while loading or if API fails) ────────────────────
const DEFAULT_FAQ = {
  intro: "Everything you need to know about our products and orders.",
  sections: [
    {
      title: "Frequently Asked Questions",
      id: "faq",
      items: [
        { q: "What materials do you use?", a: "We use high-quality epoxy resin with artist-grade pigments, glitters, and natural aggregates. All pieces are finished with a durable, glossy top coat." },
        { q: "Do you take custom orders?", a: "Yes! Share your colors, style, sizes, names/initials, or an inspiration photo and we'll design it with you." },
        { q: "How long do custom orders take?", a: "Typically 5–10 business days depending on size and complexity." },
        { q: "How do I care for my resin piece?", a: "Wipe with a soft microfiber cloth. Avoid abrasive cleaners and prolonged direct heat." },
        { q: "Do colors look exactly like the photos?", a: "We photograph in natural light, but slight variations can occur due to screens and handcrafted patterns." },
      ],
    },
    {
      title: "Shipping",
      id: "shipping",
      items: [
        { q: "Where do you ship?", a: "We currently ship across Lebanon. For international shipping, contact us on WhatsApp." },
        { q: "How much is shipping?", a: "Standard shipping is typically 6–8 USD within Lebanon." },
        { q: "How long does delivery take?", a: "Standard: 2–5 business days. Express: 1–2 business days in major areas." },
        { q: "Can I pick up my order?", a: "Local pickup can be arranged by appointment. Message us to schedule." },
      ],
    },
    {
      title: "Returns & Refunds",
      id: "returns",
      items: [
        { q: "What is your return policy?", a: "Non-custom items: returns accepted within 7 days of delivery if unused and in original packaging." },
        { q: "Are custom items returnable?", a: "Custom/personalized pieces are non-returnable, except in case of damage or defect." },
        { q: "My item arrived damaged—what do I do?", a: "Take clear photos within 48 hours and contact us. We'll arrange a replacement or solution." },
        { q: "How do refunds work?", a: "Approved refunds are processed to the original payment method within 3–10 business days." },
      ],
    },
  ],
};

/* ---------------- Accordion item ---------------- */
function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ border: "1px solid #ece5f2", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", background: "transparent",
          border: "none", padding: "14px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15 }}>{q}</span>
        <span aria-hidden style={{
          width: 26, height: 26, borderRadius: 999, display: "grid",
          placeItems: "center", background: "#f4eef9",
          color: colors.vividPurple, fontWeight: 900,
        }}>
          {isOpen ? "–" : "+"}
        </span>
      </button>
      <div style={{
        display: isOpen ? "block" : "none",
        padding: "0 16px 14px", color: "#6a5680", lineHeight: 1.65, fontSize: 14,
      }}>
        {a}
      </div>
    </div>
  );
}

function Section({ title, id, children }) {
  return (
    <section id={id} style={{ display: "grid", gap: 12 }}>
      <h2 style={{
        margin: 0, fontSize: 20, fontWeight: 900,
        background: "linear-gradient(90deg, #d4af37, #f6d77e, #d4af37)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.3,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items, openIndex, onToggle }) {
  if (!items.length) {
    return (
      <div style={{ border: "1px solid #ece5f2", borderRadius: 12, background: "#fff", padding: 14, color: "#6a5680", fontSize: 14 }}>
        No results found.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it, i) => (
        <AccordionItem key={i} q={it.q} a={it.a} isOpen={openIndex === i} onToggle={() => onToggle(i)} />
      ))}
    </div>
  );
}

/* ---------------- Main page ---------------- */
export default function FAQ() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [faqData, setFaqData] = useState(DEFAULT_FAQ);
  const [query, setQuery]     = useState("");
  const [openMap, setOpenMap] = useState({}); // { sectionIndex: openItemIndex }

  // Fetch CMS content
  useEffect(() => {
    fetch(`${PAGES_API}/pages/faq`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        // If admin saved structured sections, use them; otherwise keep defaults
        if (data?.sections?.length) {
          setFaqData({ ...DEFAULT_FAQ, ...data });
        } else if (data?.intro) {
          setFaqData((prev) => ({ ...prev, intro: data.intro }));
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (sIdx, iIdx) => {
    setOpenMap((prev) => ({
      ...prev,
      [sIdx]: prev[sIdx] === iIdx ? null : iIdx,
    }));
  };

  const filterItems = (items) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
    );
  };

  return (
    <main>
      {/* Hero */}
      <section style={{
        background: `linear-gradient(rgba(0,0,0,.30), rgba(0,0,0,.30)), url(/hero.jpeg) center/cover no-repeat`,
        color: "#fff",
        minHeight: isMobile ? 150 : 220,
        display: "grid", placeItems: "center", textAlign: "center",
        paddingTop: "clamp(90px, 14vw, 120px)",
        paddingBottom: isMobile ? 16 : 26,
        paddingInline: 12,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 40, lineHeight: 1.15 }}>
            FAQ • Shipping & Returns
          </h1>
          <p style={{ marginTop: 8, opacity: 0.95, fontSize: isMobile ? 13 : 15 }}>
            {faqData.intro}
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ background: "#faf9fb", padding: isMobile ? "16px 12px 70px" : "36px 20px 90px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 18 }}>

          {/* Anchors + search */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {faqData.sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} style={pillLinkStyle}>{s.title}</a>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search questions…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpenMap({}); }}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 12,
                border: "1px solid #d9d2df", background: "#fff",
                fontSize: isMobile ? 14 : 15, boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sections */}
          {faqData.sections.map((section, sIdx) => (
            <Section key={section.id} title={section.title} id={section.id}>
              <List
                items={filterItems(section.items)}
                openIndex={openMap[sIdx] ?? null}
                onToggle={(iIdx) => toggle(sIdx, iIdx)}
              />
            </Section>
          ))}

          {/* Help card */}
          <div style={{
            marginTop: 6, border: "1px solid #ece5f2", borderRadius: 14,
            background: "#fff", padding: isMobile ? 14 : 18, display: "grid", gap: 8,
          }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Still need help?</div>
            <div style={{ color: "#6a5680", fontSize: 14 }}>
              Message us on WhatsApp or email and we'll get back to you quickly.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="https://wa.me/96181453250" target="_blank" rel="noreferrer" style={ctaOutline}>WhatsApp</a>
              <a href="mailto:support@utopiabyrim.com" style={ctaSolid}>Email Support</a>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

const pillLinkStyle = {
  textDecoration: "none", padding: "8px 12px", borderRadius: 999,
  border: "1px solid #e6e1ea", color: colors.vividPurple,
  fontWeight: 800, background: "#fff", fontSize: 14,
};
const ctaOutline = {
  textDecoration: "none", padding: "10px 14px", borderRadius: 12,
  border: `1px solid ${colors.vividPurple}`, color: colors.vividPurple,
  fontWeight: 900, background: "#fff",
};
const ctaSolid = {
  textDecoration: "none", padding: "10px 14px", borderRadius: 12,
  border: "none", color: "#fff", fontWeight: 900,
  background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
  boxShadow: "0 10px 22px rgba(102,51,153,.18)",
};