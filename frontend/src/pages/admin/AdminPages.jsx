// frontend/src/pages/admin/AdminPages.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const LS_PAGES_KEY = "cms_pages_v1";

const PAGE_SLUGS = ["home", "about", "contact", "faq", "legal"];

/* ---------- Storage helpers ---------- */

function readPagesState() {
  try {
    const raw = localStorage.getItem(LS_PAGES_KEY);
    if (!raw) return getDefaultPages();
    const parsed = JSON.parse(raw);
    return { ...getDefaultPages(), ...parsed };
  } catch {
    return getDefaultPages();
  }
}

function writePagesState(obj) {
  try {
    localStorage.setItem(LS_PAGES_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

function getDefaultPages() {
  return {
    home: {
      heroTitle: "Handmade resin art for your dream space.",
      heroSubtitle:
        "Unique, custom-made pieces crafted with love in Lebanon.",
      heroTagline: "Highlight a main message or promo here.",
      heroButtonLabel: "Shop now",
    },
    about: {
      title: "About Utopia by Rim",
      body: `Write your brand story here. 
Who you are, why you started, what makes your resin pieces special, your process, and your values.`,
    },
    contact: {
      title: "Contact",
      email: "hello@utopiabyrim.com",
      phone: "+961 70 000 000",
      whatsapp: "+961 70 000 000",
      address: "Beirut, Lebanon",
      note: "You can also update WhatsApp & social links in Settings.",
    },
    faq: {
      intro:
        "Answer common questions here so customers feel comfortable before ordering.",
      content: `Q: How long does it take to receive my order?
A: Production usually takes 5–10 days depending on the item.

Q: Do you accept custom orders?
A: Yes! Contact us on WhatsApp or Instagram with your idea.`,
    },
    legal: {
      title: "Terms & Conditions",
      content: `Write your store policies here: returns, refunds, delivery, damage, payment rules, etc.`,
    },
  };
}

/* ---------- Main component ---------- */

export default function AdminPages() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [pages, setPages] = useState(() => readPagesState());
  const [activeSlug, setActiveSlug] = useState("home");
  const [saving, setSaving] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    // ensure defaults merged
    setPages((prev) => ({ ...getDefaultPages(), ...prev }));
  }, []);

  const activePageData = useMemo(
    () => pages[activeSlug] || {},
    [pages, activeSlug]
  );

  const updateField = (slug, field, value) => {
    setPages((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] || {}),
        [field]: value,
      },
    }));
  };

  const onSave = (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    writePagesState(pages);
    setSaving(false);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1500);
  };

  const layoutStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
    gap: 14,
    alignItems: "flex-start",
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
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>
            Pages
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            Edit the main text for your Home, About, Contact, FAQ and Legal pages.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            Changes are saved in your browser (local demo). In a real
            backend this would be stored in the database.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {savedFlag && (
            <span
              style={{
                fontSize: 11,
                color: "#2e7d32",
                background: "rgba(76,175,80,0.1)",
                borderRadius: 999,
                padding: "4px 8px",
              }}
            >
              Saved ✓
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {/* LAYOUT: sidebar + editor */}
      <div style={layoutStyle}>
        {/* LEFT: Page selection */}
        <aside
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#faf6ff",
            padding: 10,
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            gap: 6,
            overflowX: isMobile ? "auto" : "visible",
          }}
        >
          {PAGE_SLUGS.map((slug) => {
            const active = slug === activeSlug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setActiveSlug(slug)}
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
                  whiteSpace: "nowrap",
                }}
              >
                {labelForSlug(slug)}
              </button>
            );
          })}
        </aside>

        {/* RIGHT: Active page editor */}
        <section
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#fff",
            padding: 14,
          }}
        >
          {activeSlug === "home" && (
            <HomeEditor
              data={activePageData}
              onChange={(field, value) =>
                updateField("home", field, value)
              }
            />
          )}
          {activeSlug === "about" && (
            <AboutEditor
              data={activePageData}
              onChange={(field, value) =>
                updateField("about", field, value)
              }
            />
          )}
          {activeSlug === "contact" && (
            <ContactEditor
              data={activePageData}
              onChange={(field, value) =>
                updateField("contact", field, value)
              }
            />
          )}
          {activeSlug === "faq" && (
            <FaqEditor
              data={activePageData}
              onChange={(field, value) =>
                updateField("faq", field, value)
              }
            />
          )}
          {activeSlug === "legal" && (
            <LegalEditor
              data={activePageData}
              onChange={(field, value) =>
                updateField("legal", field, value)
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Labels ---------- */

function labelForSlug(slug) {
  switch (slug) {
    case "home":
      return "Home";
    case "about":
      return "About";
    case "contact":
      return "Contact";
    case "faq":
      return "FAQ";
    case "legal":
      return "Legal";
    default:
      return slug;
  }
}

/* ---------- Editors ---------- */

function fieldLabelStyle() {
  return {
    fontSize: 12,
    color: "#4f3d5c",
    display: "block",
  };
}

function textInputStyle() {
  return {
    marginTop: 3,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,122,173,0.5)",
    fontSize: 13,
    boxSizing: "border-box",
  };
}

function textAreaStyle(rows = 4) {
  return {
    ...textInputStyle(),
    resize: "vertical",
    minHeight: rows * 20,
  };
}

/* --- Home page editor --- */

function HomeEditor({ data, onChange }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "grid", gap: 10 }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: "#3c274f",
          }}
        >
          Home page
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#7a6989",
          }}
        >
          Control the hero text that appears at the top of your homepage.
        </p>
      </div>

      <label style={fieldLabelStyle()}>
        Hero title
        <input
          type="text"
          value={data.heroTitle || ""}
          onChange={(e) => onChange("heroTitle", e.target.value)}
          style={textInputStyle()}
          placeholder="Main message at the top..."
        />
      </label>

      <label style={fieldLabelStyle()}>
        Hero subtitle
        <textarea
          value={data.heroSubtitle || ""}
          onChange={(e) => onChange("heroSubtitle", e.target.value)}
          style={textAreaStyle(3)}
          placeholder="Short description under the main title..."
        />
      </label>

      <label style={fieldLabelStyle()}>
        Hero tagline / highlight
        <input
          type="text"
          value={data.heroTagline || ""}
          onChange={(e) => onChange("heroTagline", e.target.value)}
          style={textInputStyle()}
          placeholder="Small line to highlight a promotion or unique value..."
        />
      </label>

      <label style={fieldLabelStyle()}>
        Button label
        <input
          type="text"
          value={data.heroButtonLabel || ""}
          onChange={(e) =>
            onChange("heroButtonLabel", e.target.value)
          }
          style={textInputStyle()}
          placeholder="e.g. Shop now, View collection, Contact us"
        />
      </label>
    </form>
  );
}

/* --- About page editor --- */

function AboutEditor({ data, onChange }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "grid", gap: 10 }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: "#3c274f",
          }}
        >
          About page
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#7a6989",
          }}
        >
          Share your story, your process, and what makes Utopia by Rim
          special.
        </p>
      </div>

      <label style={fieldLabelStyle()}>
        Title
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onChange("title", e.target.value)}
          style={textInputStyle()}
          placeholder="About Utopia by Rim"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Body
        <textarea
          value={data.body || ""}
          onChange={(e) => onChange("body", e.target.value)}
          style={textAreaStyle(8)}
          placeholder="Write your about text here..."
        />
      </label>
    </form>
  );
}

/* --- Contact page editor --- */

function ContactEditor({ data, onChange }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "grid", gap: 10 }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: "#3c274f",
          }}
        >
          Contact page
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#7a6989",
          }}
        >
          Update your public contact info. This is what customers see on
          the contact section/page.
        </p>
      </div>

      <label style={fieldLabelStyle()}>
        Title
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onChange("title", e.target.value)}
          style={textInputStyle()}
          placeholder="Contact"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Email
        <input
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          style={textInputStyle()}
          placeholder="hello@utopiabyrim.com"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Phone
        <input
          type="text"
          value={data.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          style={textInputStyle()}
          placeholder="+961 70 000 000"
        />
      </label>

      <label style={fieldLabelStyle()}>
        WhatsApp
        <input
          type="text"
          value={data.whatsapp || ""}
          onChange={(e) => onChange("whatsapp", e.target.value)}
          style={textInputStyle()}
          placeholder="+961 70 000 000"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Address
        <input
          type="text"
          value={data.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          style={textInputStyle()}
          placeholder="Beirut, Lebanon"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Note / extra info
        <textarea
          value={data.note || ""}
          onChange={(e) => onChange("note", e.target.value)}
          style={textAreaStyle(4)}
          placeholder="Extra instructions, working hours, etc."
        />
      </label>
    </form>
  );
}

/* --- FAQ page editor --- */

function FaqEditor({ data, onChange }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "grid", gap: 10 }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: "#3c274f",
          }}
        >
          FAQ page
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#7a6989",
          }}
        >
          Answer common questions to reduce DMs and make customers feel
          safe before ordering.
        </p>
      </div>

      <label style={fieldLabelStyle()}>
        Intro text
        <textarea
          value={data.intro || ""}
          onChange={(e) => onChange("intro", e.target.value)}
          style={textAreaStyle(3)}
          placeholder="Short intro about your FAQ..."
        />
      </label>

      <label style={fieldLabelStyle()}>
        FAQ content
        <textarea
          value={data.content || ""}
          onChange={(e) => onChange("content", e.target.value)}
          style={textAreaStyle(10)}
          placeholder={`Q: Example question?\nA: Example answer.\n\nQ: Another question?\nA: Another answer.`}
        />
        <span
          style={{
            marginTop: 3,
            display: "block",
            fontSize: 11,
            color: "#a38fb5",
          }}
        >
          You can write your questions and answers in plain text. Later
          you can render this nicely on the public FAQ page.
        </span>
      </label>
    </form>
  );
}

/* --- Legal page editor --- */

function LegalEditor({ data, onChange }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "grid", gap: 10 }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: "#3c274f",
          }}
        >
          Legal / Terms page
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#7a6989",
          }}
        >
          Add your store policies: returns, refunds, cancellations,
          payment terms, and delivery rules.
        </p>
      </div>

      <label style={fieldLabelStyle()}>
        Title
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onChange("title", e.target.value)}
          style={textInputStyle()}
          placeholder="Terms & Conditions"
        />
      </label>

      <label style={fieldLabelStyle()}>
        Content
        <textarea
          value={data.content || ""}
          onChange={(e) => onChange("content", e.target.value)}
          style={textAreaStyle(12)}
          placeholder="Write your terms and policies here..."
        />
      </label>
    </form>
  );
}
