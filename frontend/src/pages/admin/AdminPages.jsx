// frontend/src/pages/admin/AdminPages.jsx
import React, { useEffect, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

async function fetchAllPages() {
  const res = await fetch(`${API_BASE}/pages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to load pages (${res.status})`);
  return res.json(); // { home: {...}, about: {...}, ... }
}

async function savePage(slug, content) {
  const res = await fetch(`${API_BASE}/admin/pages/${slug}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to save (${res.status})`);
  }
  return res.json();
}

// ─── DEFAULT CONTENT (fallback while loading) ─────────────────────────────────
function getDefaultPages() {
  return {
    home: {
      heroTitle: "Handmade resin art for your dream space.",
      heroSubtitle: "Unique, custom-made pieces crafted with love in Lebanon.",
      heroTagline: "Highlight a main message or promo here.",
      heroButtonLabel: "Shop now",
    },
    about: {
      title: "About Utopia by Rim",
      body: "Write your brand story here.",
    },
    contact: {
      title: "Contact",
      email: "hello@utopiabyrim.com",
      phone: "+961 70 000 000",
      whatsapp: "+961 70 000 000",
      address: "Beirut, Lebanon",
      note: "",
    },
    faq: {
      intro: "Answer common questions here.",
      content: "",
    },
    legal: {
      title: "Terms & Conditions",
      content: "",
    },
  };
}

const PAGE_SLUGS = ["home", "contact", "faq", "legal"];

function labelForSlug(slug) {
  return { home: "Home", about: "About", contact: "Contact", faq: "FAQ", legal: "Legal" }[slug] ?? slug;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminPages() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [pages, setPages]           = useState(getDefaultPages());
  const [activeSlug, setActiveSlug] = useState("home");
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(null);
  const [savedFlag, setSavedFlag]   = useState(false);

  // ─── Load all pages from API on mount ──────────────────────────────────────
  // Load once on mount — deep merge each page with defaults
  const loadPages = () => {
    console.log("LOAD PAGES CALLED", new Error().stack);
    setLoading(true);
    setLoadError(null);
    fetchAllPages()
      .then((data) => {
        const defaults = getDefaultPages();
        const merged = {};
        for (const slug of Object.keys(defaults)) {
          merged[slug] = { ...defaults[slug], ...(data[slug] ?? {}) };
        }
        setPages(merged);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPages(); }, []); // eslint-disable-line

  // Read directly from state
  const activePageData = pages[activeSlug] || {};

  const updateField = (slug, field, value) => {
    setPages((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] || {}), [field]: value },
    }));
  };

  // ─── Save active page — plain function, always closes over latest pages state
  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const slug = activeSlug;
    const snapshot = { ...pages[slug] }; // copy current state at click time
    try {
      await savePage(slug, snapshot);
      // Don't overwrite state — user already sees correct value from typing
      // Just show the confirmation badge
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 2000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>Pages</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            Edit the main text for your Home, About, Contact, FAQ and Legal pages.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            Changes are saved to the database.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {savedFlag && (
            <span style={{
              fontSize: 11, color: "#2e7d32",
              background: "rgba(76,175,80,0.1)",
              borderRadius: 999, padding: "4px 10px",
            }}>
              Saved ✓
            </span>
          )}
          {saveError && (
            <span style={{
              fontSize: 11, color: "#b71c1c",
              background: "rgba(244,67,54,0.1)",
              borderRadius: 999, padding: "4px 10px",
            }}>
              ⚠ {saveError}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: saving || loading ? "not-allowed" : "pointer",
              opacity: saving || loading ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : `Save ${labelForSlug(activeSlug)}`}
          </button>
        </div>
      </header>

      {/* LOAD ERROR */}
      {loadError && (
        <div style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(244,67,54,0.07)",
          border: "1px solid rgba(244,67,54,0.3)",
          color: "#b71c1c",
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}>
          <span>⚠ Failed to load pages: {loadError}</span>
          <button
            onClick={loadPages}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 999,
              border: "none", background: "#b71c1c", color: "#fff", cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{ padding: "30px 0", textAlign: "center", color: "#7a6989", fontSize: 13 }}>
          Loading pages…
        </div>
      )}

      {/* LAYOUT: sidebar + editor */}
      {!loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
          gap: 14,
          alignItems: "flex-start",
        }}>
          {/* LEFT: page selector */}
          <aside style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#faf6ff",
            padding: 10,
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            gap: 6,
            overflowX: isMobile ? "auto" : "visible",
          }}>
            {PAGE_SLUGS.map((slug) => {
              const active = slug === activeSlug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => { setActiveSlug(slug); setSaveError(null); }}
                  style={{
                    flex: isMobile ? "0 0 auto" : "1 0 auto",
                    padding: "7px 11px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid rgba(124,81,161,0.9)"
                      : "1px solid rgba(148,122,173,0.35)",
                    background: active ? "#f9f3ff" : "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                    color: active ? "#4a2a73" : "#4f3d5c",
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {labelForSlug(slug)}
                </button>
              );
            })}
          </aside>

          {/* RIGHT: editor */}
          <section style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#fff",
            padding: 14,
          }}>
            {activeSlug === "home"    && <HomeEditor    data={activePageData} onChange={(f, v) => updateField("home",    f, v)} />}
            {activeSlug === "contact" && <ContactEditor data={activePageData} onChange={(f, v) => updateField("contact", f, v)} />}
            {activeSlug === "faq"     && <FaqEditor     data={activePageData} onChange={(f, v) => updateField("faq",     f, v)} />}
            {activeSlug === "legal"   && <LegalEditor   data={activePageData} onChange={(f, v) => updateField("legal",   f, v)} />}
          </section>
        </div>
      )}
    </div>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const fieldLabel = {
  fontSize: 12,
  color: "#4f3d5c",
  display: "block",
  fontWeight: 600,
  marginBottom: 2,
};

const inputStyle = {
  marginTop: 3,
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(148,122,173,0.5)",
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
};

const areaStyle = (rows = 4) => ({
  ...inputStyle,
  resize: "vertical",
  minHeight: rows * 22,
  fontFamily: "inherit",
});

function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>{title}</h2>
      <p style={{ marginTop: 4, fontSize: 12, color: "#7a6989" }}>{description}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 2 }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

// ─── PAGE EDITORS ─────────────────────────────────────────────────────────────
function HomeEditor({ data, onChange }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionHeader
        title="Home page"
        description="Control the hero text that appears at the top of your homepage."
      />
      <Field label="Hero title">
        <input type="text" value={data.heroTitle || ""} onChange={(e) => onChange("heroTitle", e.target.value)} style={inputStyle} placeholder="Main message at the top…" />
      </Field>
      <Field label="Hero subtitle">
        <textarea value={data.heroSubtitle || ""} onChange={(e) => onChange("heroSubtitle", e.target.value)} style={areaStyle(3)} placeholder="Short description under the main title…" />
      </Field>
      <Field label="Hero tagline / highlight">
        <input type="text" value={data.heroTagline || ""} onChange={(e) => onChange("heroTagline", e.target.value)} style={inputStyle} placeholder="Small line to highlight a promotion…" />
      </Field>
      <Field label="Button label">
        <input type="text" value={data.heroButtonLabel || ""} onChange={(e) => onChange("heroButtonLabel", e.target.value)} style={inputStyle} placeholder="e.g. Shop now" />
      </Field>
    </div>
  );
}

function AboutEditor({ data, onChange }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionHeader
        title="About page"
        description="Share your story, your process, and what makes Utopia by Rim special."
      />
      <Field label="Title">
        <input type="text" value={data.title || ""} onChange={(e) => onChange("title", e.target.value)} style={inputStyle} placeholder="About Utopia by Rim" />
      </Field>
      <Field label="Body">
        <textarea value={data.body || ""} onChange={(e) => onChange("body", e.target.value)} style={areaStyle(10)} placeholder="Write your about text here…" />
      </Field>
    </div>
  );
}

function ContactEditor({ data, onChange }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionHeader
        title="Contact page"
        description="Update your public contact info. This is what customers see."
      />
      <Field label="Title">
        <input type="text" value={data.title || ""} onChange={(e) => onChange("title", e.target.value)} style={inputStyle} placeholder="Contact" />
      </Field>
      <Field label="Email">
        <input type="email" value={data.email || ""} onChange={(e) => onChange("email", e.target.value)} style={inputStyle} placeholder="hello@utopiabyrim.com" />
      </Field>
      <Field label="Phone">
        <input type="text" value={data.phone || ""} onChange={(e) => onChange("phone", e.target.value)} style={inputStyle} placeholder="+961 70 000 000" />
      </Field>
      <Field label="WhatsApp">
        <input type="text" value={data.whatsapp || ""} onChange={(e) => onChange("whatsapp", e.target.value)} style={inputStyle} placeholder="+961 70 000 000" />
      </Field>
      <Field label="Address">
        <input type="text" value={data.address || ""} onChange={(e) => onChange("address", e.target.value)} style={inputStyle} placeholder="Beirut, Lebanon" />
      </Field>
      <Field label="Note / extra info">
        <textarea value={data.note || ""} onChange={(e) => onChange("note", e.target.value)} style={areaStyle(4)} placeholder="Extra instructions, working hours, etc." />
      </Field>
    </div>
  );
}

function FaqEditor({ data, onChange }) {
  // sections: [{ title, id, items: [{ q, a }] }]
  const sections = Array.isArray(data.sections) && data.sections.length
    ? data.sections
    : [
        { title: "Frequently Asked Questions", id: "faq", items: [{ q: "", a: "" }] },
        { title: "Shipping", id: "shipping", items: [{ q: "", a: "" }] },
        { title: "Returns & Refunds", id: "returns", items: [{ q: "", a: "" }] },
      ];

  const updateSections = (updated) => onChange("sections", updated);

  const updateItem = (sIdx, iIdx, field, value) => {
    const next = sections.map((s, si) =>
      si !== sIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== iIdx ? it : { ...it, [field]: value }),
      }
    );
    updateSections(next);
  };

  const addItem = (sIdx) => {
    const next = sections.map((s, si) =>
      si !== sIdx ? s : { ...s, items: [...s.items, { q: "", a: "" }] }
    );
    updateSections(next);
  };

  const removeItem = (sIdx, iIdx) => {
    const next = sections.map((s, si) =>
      si !== sIdx ? s : { ...s, items: s.items.filter((_, ii) => ii !== iIdx) }
    );
    updateSections(next);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionHeader
        title="FAQ page"
        description="Edit questions and answers for each section. Changes save to the database."
      />

      <Field label="Intro text">
        <textarea
          value={data.intro || ""}
          onChange={(e) => onChange("intro", e.target.value)}
          style={areaStyle(2)}
          placeholder="Short intro shown on the FAQ page…"
        />
      </Field>

      {sections.map((section, sIdx) => (
        <div key={section.id} style={{
          border: "1px solid rgba(148,122,173,0.25)",
          borderRadius: 12, padding: 12, display: "grid", gap: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3c274f" }}>
            {section.title}
          </div>

          {section.items.map((item, iIdx) => (
            <div key={iIdx} style={{
              background: "#faf6ff", borderRadius: 10,
              padding: 10, display: "grid", gap: 6,
              border: "1px solid rgba(148,122,173,0.15)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7a6989", fontWeight: 600 }}>Q&A #{iIdx + 1}</span>
                {section.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(sIdx, iIdx)}
                    style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 999,
                      border: "1px solid rgba(244,67,54,0.4)", background: "transparent",
                      color: "#b71c1c", cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={item.q}
                onChange={(e) => updateItem(sIdx, iIdx, "q", e.target.value)}
                placeholder="Question…"
                style={{ ...inputStyle, fontWeight: 600 }}
              />
              <textarea
                value={item.a}
                onChange={(e) => updateItem(sIdx, iIdx, "a", e.target.value)}
                placeholder="Answer…"
                style={areaStyle(2)}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => addItem(sIdx)}
            style={{
              fontSize: 12, padding: "6px 12px", borderRadius: 999,
              border: "1px dashed rgba(124,81,161,0.5)", background: "transparent",
              color: "#4a2a73", cursor: "pointer", fontWeight: 600,
            }}
          >
            + Add question
          </button>
        </div>
      ))}
    </div>
  );
}

function LegalEditor({ data, onChange }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionHeader
        title="Legal / Terms page"
        description="Add your store policies: returns, refunds, cancellations, payment terms, and delivery rules."
      />
      <Field label="Title">
        <input type="text" value={data.title || ""} onChange={(e) => onChange("title", e.target.value)} style={inputStyle} placeholder="Terms & Conditions" />
      </Field>
      <Field label="Content">
        <textarea value={data.content || ""} onChange={(e) => onChange("content", e.target.value)} style={areaStyle(14)} placeholder="Write your terms and policies here…" />
      </Field>
    </div>
  );
}