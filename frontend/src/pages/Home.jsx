// frontend/src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { colors, radii, shadows } from "../theme";
import ServiceArchCard from "../components/ServiceArchCard";
import BestSellerCard from "../components/BestSellerCard";
import useBreakpoint from "../hooks/useBreakpoint";
import AboutSection from "../pages/About";
import ContactSection from "../pages/ContactSection";
import { addToCart } from "../api/cart";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const PAGES_API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function resolveImageUrl(url) {
  if (!url) return "/best/best1.jpg";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

// ─── DEFAULT hero content (shown while loading or if API fails) ───────────────
const DEFAULT_HOME = {
  heroTitle: "Handmade resin art for your dream space.",
  heroSubtitle: "Unique, custom-made pieces crafted with love in Lebanon.",
  heroTagline: "",
  heroButtonLabel: "Shop Now",
};

function ServicesElegant() {
  const bp = useBreakpoint();
  const cols = bp.xs ? 1 : (bp.sm || bp.md) ? 2 : 3;

  return (
    <section
      id="services"
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
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAdd = async (product) => {
    if (!isAuthenticated) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    try {
      await addToCart(product.id, 1);
      alert("Added to cart!");
      window.navigator.vibrate?.(10);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert(err?.message || "Failed to add to cart");
    }
  };

  React.useEffect(() => {
    async function fetchBestSellers() {
      try {
        setLoading(true);
        const { getBestSellers } = await import("../api/products");
        const res = await getBestSellers({ limit: 6 });
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setItems(list);
      } catch (error) {
        console.error("Failed to load best sellers:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBestSellers();
  }, []);

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
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {loading ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#fff" }}>
                Loading best sellers...
              </div>
            ) : items.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#fff" }}>
                No best sellers available
              </div>
            ) : (
              items.map((p) => {
                const primary = p.images?.find((img) => img.isPrimary) || p.images?.[0];
                const item = {
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  slug: p.slug,
                  image: resolveImageUrl(primary?.url),
                };
                return (
                  <BestSellerCard
                    key={p.id}
                    image={item.image}
                    name={item.name}
                    price={item.price}
                    slug={item.slug}
                    onAdd={() => handleAdd(item)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN HOME COMPONENT ──────────────────────────────────────────────────────
export default function Home() {
  const gold = "#d4af37";
  const [hero, setHero] = React.useState(DEFAULT_HOME);

  // Fetch home page content from CMS
  React.useEffect(() => {
    fetch(`${PAGES_API}/pages/home`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setHero({ ...DEFAULT_HOME, ...data }))
      .catch(() => {
        // silently fall back to defaults — page still works
      });
  }, []);

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(/hero.jpeg) center/cover no-repeat`,
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

          {/* ── CMS-driven content ── */}
          {hero.heroTitle && (
            <p
              style={{
                marginTop: 12,
                fontSize: 22,
                color: "#f5e6c8",
                fontWeight: 600,
                textShadow: "0 1px 8px rgba(0,0,0,.35)",
              }}
            >
              {hero.heroTitle}
            </p>
          )}

          <p
            style={{
              marginTop: 8,
              fontSize: 18,
              color: "#f5e6c8",
              textShadow: "0 1px 8px rgba(0,0,0,.35)",
            }}
          >
            {hero.heroSubtitle || "Handcrafted Resin Elegance — Made with Heart, Designed to Shine."}
          </p>

          {hero.heroTagline && (
            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#fde8a0",
                fontStyle: "italic",
                textShadow: "0 1px 6px rgba(0,0,0,.3)",
              }}
            >
              {hero.heroTagline}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 22,
              flexWrap: "wrap",
            }}
          >
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
              {hero.heroButtonLabel || "Shop Now"}
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

      <ServicesElegant />
      <BestSellers />
      <AboutSection />
      <ContactSection />
    </main>
  );
}