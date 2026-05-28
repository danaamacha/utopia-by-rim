import React from "react";

export default function Footer() {
  const gold = "#d4af37";
  const purple = "#3d264b";
  const softLav = "#77637aff";

  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: softLav,
        color: "#fff",
        padding: "60px 24px 30px",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 40,
        }}
      >
        {/* Brand */}
        <div>
          <h3
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 38,
              margin: 0,
              color: gold,
            }}
          >
            Utopia by Rim
          </h3>
          <p
            style={{
              marginTop: 10,
              color: "#f2e7f5",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Handcrafted resin art & decor, designed to bring light, color, and
            warmth into every corner of your home.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 style={{ color: gold, marginBottom: 10 }}>Quick Links</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
            {[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: "About", href: "#about" },
              { label: "Contact", href: "#contact" },
              { label: "FAQ / Shipping & Returns", href: "/faq" },
              { label: "Legal — Terms & Privacy", href: "/legal" },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  style={{
                    color: "#fff",
                    textDecoration: "none",
                    transition: "color .2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = gold)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ color: gold, marginBottom: 10 }}>Get in touch</h4>
          <p style={{ margin: "4px 0", color: "#f2e7f5" }}>📍 Beirut, Lebanon</p>
          <p style={{ margin: "4px 0", color: "#f2e7f5" }}>
            ✉️{" "}
            <a href="mailto:hello@utopiabyrim.com" style={{ color: "#fff" }}>
              hello@utopiabyrim.com
            </a>
          </p>
          <p style={{ margin: "4px 0", color: "#f2e7f5" }}>
            💬{" "}
            <a
              href="https://wa.me/96181453250"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#fff" }}
            >
              WhatsApp
            </a>
          </p>
          <p style={{ margin: "4px 0", color: "#f2e7f5" }}>
            📷{" "}
            <a
              href="https://instagram.com/utopia_by_rim"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#fff" }}
            >
              Instagram
            </a>
          </p>
        </div>

        {/* Newsletter / subscribe */}
        <div>
          <h4 style={{ color: gold, marginBottom: 10 }}>Stay Updated</h4>
          <p style={{ fontSize: 15, color: "#f2e7f5", marginBottom: 10 }}>
            Get news & limited-edition releases right to your inbox.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="email"
              placeholder="Your email"
              required
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.6)",
                outline: "none",
                fontSize: 14,
              }}
              onFocus={(e) => (e.currentTarget.style.border = `1px solid ${gold}`)}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,.6)")}
            />
            <button
              type="submit"
              style={{
                background: `linear-gradient(90deg, ${gold}, #f6d77e)`,
                color: purple,
                fontWeight: 700,
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                cursor: "pointer",
                transition: "opacity .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          marginTop: 40,
          borderTop: "1px solid rgba(255,255,255,.3)",
          paddingTop: 14,
          textAlign: "center",
          fontSize: 14,
          color: "#f2e7f5",
        }}
      >
        © {year} Utopia by Rim — All rights reserved.
      </div>
    </footer>
  );
}
