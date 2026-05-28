// frontend/src/sections/AboutSection.jsx
import React, { useMemo } from "react";
import useBreakpoint from "../hooks/useBreakpoint";

const GOLD = "#d4af37";
const BG    = "#b498b9";   // Section background (change here)
const CARD  = "#cdb4d6";   // Right card background
const INK   = "#3d264b";   // Text color

/* ——— Subtle, professional sparkles ——— */
function SparklesLayer({ count = 10 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 6,
        delay: Math.random() * 3,
        dur: 2.5 + Math.random() * 2.2,
      })),
    [count]
  );
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {dots.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(246,215,126,1) 0%, rgba(246,215,126,.65) 40%, rgba(246,215,126,0) 70%)",
            filter: "blur(.2px)",
            opacity: 0.6,
            animation: `twinkle ${d.dur}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function AboutSection() {
  const bp = useBreakpoint();

  return (
    <section
      id="about"
      style={{
        position: "relative",
        background: BG,
        padding: bp.xs || bp.sm ? "48px 16px 64px" : "90px 40px",
        overflow: "hidden",
      }}
    >
      {/* minimal animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { transform: scale(.7); opacity: .35; }
          50% { transform: scale(1.05); opacity: .9; }
        }
        @keyframes floaty {
          0% { transform: translateY(0px) }
          50% { transform: translateY(-6px) }
          100% { transform: translateY(0px) }
        }
      `}</style>

      {/* background sparkles (subtle) */}
      <SparklesLayer count={8} />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: bp.xs || bp.sm ? "1fr" : "0.95fr 1.05fr",
          gap: bp.xs || bp.sm ? 24 : 40,
          alignItems: "center",
        }}
      >
        {/* LEFT — Hero image with refined mask */}
        <div
          style={{
            display: "grid",
            placeItems: "center",
            animation: "floaty 8s ease-in-out infinite",
          }}
        >
          <div
            style={{
              width: bp.xs ? "84%" : "86%",
              aspectRatio: "4/5",
              borderRadius: "140px 140px 0 0",
              overflow: "hidden",
              border: `5px solid ${GOLD}`,
              background: "#fff",
              boxShadow: "0 10px 28px rgba(0,0,0,.18)",
            }}
          >
            <img
              src="/best/best6.jpg"
              alt="Handcrafted resin art piece"
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

        {/* RIGHT — Content card */}
        <div
          style={{
            background: CARD,
            color: INK,
            borderRadius: 24,
            padding: bp.xs ? "22px 18px" : "42px 46px",
            border: `1px solid rgba(212,175,55,.35)`,
            boxShadow: "0 10px 26px rgba(0,0,0,.12)",
            position: "relative",
          }}
        >
          {/* Title (static, no animation) */}
          <h2
            style={{
              margin: 0,
              textAlign: "center",
              fontFamily: "'Great Vibes', cursive",
              fontSize: "clamp(40px, 5vw, 60px)",
              color: "#f6d77e",
              textShadow: "0 2px 10px rgba(0,0,0,.12)",
            }}
          >
            About us
          </h2>

          {/* Subhead */}
          <p
            style={{
              margin: "10px 0 16px",
              textAlign: "center",
              fontSize: "clamp(16px, 2.2vw, 18px)",
              lineHeight: 1.7,
              opacity: 0.95,
            }}
          >
            At <strong>Utopia byRim</strong>, every piece is slow-crafted by hand —
            one-of-a-kind resin art, designed to last and made with heart.
          </p>

          {/* Why choose us — 3 bullets */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bp.xs || bp.sm ? "1fr" : "1fr 1fr",
              gap: 14,
              marginTop: 10,
            }}
          >
            {[
              {
                title: "Custom to your taste",
                text: "Colors, shapes & finishes tailored to your space.",
              },
              {
                title: "Premium materials",
                text: "UV-resistant resin & pro pigments to keep the shine.",
              },
              {
                title: "Gift-ready",
                text: "Beautiful packaging with optional personal notes.",
              },
              {
                title: "Made in Lebanon",
                text: "Small-batch craftsmanship, shipped with care.",
              },
            ].map((it) => (
              <div
                key={it.title}
                style={{
                  background: "rgba(255,255,255,.45)",
                  border: `1px solid rgba(212,175,55,.35)`,
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{it.title}</div>
                <div style={{ opacity: 0.9 }}>{it.text}</div>
              </div>
            ))}
          </div>

          {/* Metrics strip */}
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: bp.xs || bp.sm ? "1fr 1fr" : "repeat(3, 1fr)",
              gap: 10,
              textAlign: "center",
            }}
          >
            {[
              { k: "250+", v: "Custom pieces" },
              { k: "4.9★", v: "Client rating" },
              { k: "48h", v: "Reply time" },
            ].map((m) => (
              <div
                key={m.v}
                style={{
                  background: "rgba(255,255,255,.6)",
                  border: `1px solid rgba(212,175,55,.35)`,
                  borderRadius: 12,
                  padding: "12px 8px",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>{m.k}</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/shop"
              style={{
                background: INK,
                color: "#fff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: 14,
                border: `1px solid ${INK}`,
              }}
            >
              Shop collection
            </a>
            <a
              href="#contact"
              style={{
                background: "#fff",
                color: INK,
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: 14,
                border: `1px solid rgba(212,175,55,.6)`,
              }}
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
