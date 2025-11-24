// frontend/src/pages/Home.jsx
import React from "react";
import { colors, radii, shadows } from "../theme";
import ServiceArchCard from "../components/ServiceArchCard";
import BestSellerCard from "../components/BestSellerCard";
import useBreakpoint from "../hooks/useBreakpoint";
import AboutSection from "../pages/About";
import ContactSection from "../pages/ContactSection";

function ServicesElegant() {
  const bp = useBreakpoint();
  const cols = bp.xs ? 1 : (bp.sm || bp.md) ? 2 : 3;

  return (
    <section
      id="services"  // ✅ This line makes scroll-to-section work
      style={{
        background: "#9a8ba0",
        padding: bp.xs || bp.sm ? "40px 16px 56px" : "60px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            margin: 0,
            marginBottom: bp.xs ? 24 : 40,
            fontFamily: "'Great Vibes', cursive",
            background: "linear-gradient(90deg, #d4af37, #f6d77e, #d4af37)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "clamp(36px, 6vw, 70px)",
            fontWeight: 400,
            letterSpacing: 2,
            backgroundSize: "200%",
            animation: "shine 4s linear infinite",
          }}
        >
          Our services
        </h2>

        <div
          style={{
            display: "grid",
            gap: bp.xs ? 14 : bp.sm ? 18 : 26,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            marginTop: bp.xs ? 24 : 50,
          }}
        >
          <ServiceArchCard
            image="/services/letter_r.jpg"
            title="CUSTOMIZATION"
            text="We bring your imagination to life—from personalized trays and coasters to name signs and keepsakes. Choose your favorite colors, designs, and finishes for a piece that's uniquely yours."
          />
          <ServiceArchCard
            image="/services/letter_i.jpg"
            title="Event & Gift Personalization"
            text="Make every occasion unforgettable with custom-made resin pieces for weddings, birthdays, and corporate gifts. Each product is handmade with love and attention to detail."
          />
          <ServiceArchCard
            image="/services/letter_m.jpg"
            title="Home Décor Collection"
            text="Explore our curated collection of resin art for every corner of your home—from elegant wall pieces to functional art that elevates your space with timeless beauty."
          />
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  const bp = useBreakpoint();
  const cols = bp.xs ? 1 : bp.sm ? 2 : 3;

  const items = [
    { image: "/best/best1.jpg", name: "Agate Clock", price: 56 },
    { image: "/best/best3.jpg", name: "Ocean Table", price: 42000 },
    { image: "/best/best5.jpg", name: "Forest Coasters", price: 42000 },
  ];

  return (
    <section style={{ background: "#8d7f96", padding: "48px 20px 70px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            margin: 0,
            fontFamily: "'Great Vibes', cursive",
            background: "linear-gradient(90deg, #d4af37, #f6d77e, #d4af37)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "clamp(36px, 6vw, 68px)",
            fontWeight: 400,
            letterSpacing: 2,
            backgroundSize: "200%",
            animation: "shine 4s linear infinite",
          }}
        >
          Our best sellers
        </h2>

        <div
          style={{
            marginTop: 28,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: bp.xs ? 14 : 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 18,
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {items.map((p) => (
              <BestSellerCard key={p.name} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const gold = "#d4af37";

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background:
            `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(/hero.jpeg) center/cover no-repeat`,
          minHeight: "88vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: "60px 20px",
          paddingTop: "clamp(90px, 14vw, 120px)",
        }}
      >
        <div style={{ maxWidth: 980 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 64,
              lineHeight: 1.05,
              color: gold,
              textShadow: "0 2px 16px rgba(0,0,0,.35)",
            }}
          >
            Welcome to
            <br />
            utopia— byRim!
          </h1>

          <p
            style={{
              marginTop: 16,
              fontSize: 20,
              color: "#f5e6c8",
              textShadow: "0 1px 8px rgba(0,0,0,.35)",
            }}
          >
            Handcrafted Resin Elegance — Made with Heart, Designed to Shine.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
            <a
              href="/shop"
              style={{
                background: colors.royalPlum,
                color: "#fff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: radii.sm,
                boxShadow: shadows.subtle,
              }}
            >
              Shop Now
            </a>
            <a
              href="/about"
              style={{
                background: "#ffffff",
                color: colors.vividPurple,
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: radii.sm,
                border: `1px solid ${colors.vividPurple}`,
                boxShadow: shadows.subtle,
              }}
            >
              Discover the Story
            </a>
          </div>
        </div>
      </section>

      {/* OUR SERVICES */}
      <ServicesElegant />

      {/* BEST SELLERS */}
      <BestSellers />

      {/* ABOUT */}
      <AboutSection />

      {/* CONTACT */}
      <ContactSection />
    </main>
  );
}
