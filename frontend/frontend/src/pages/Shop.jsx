// frontend/src/pages/Shop.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";

/* ---------------- Catalog ---------------- */
const CATALOG = [
  { id: "p1", name: "Agate Clock",        price: 56,  compareAt: 70,  image: "/best/best1.jpg",  cat: "Clocks" },
  { id: "p2", name: "Ocean Table",        price: 420, compareAt: 560, image: "/best/best3.jpg",  cat: "Tables" },
  { id: "p3", name: "Forest Coasters",    price: 42,                  image: "/best/best5.jpg",  cat: "Coasters" },
  { id: "p4", name: "Marble Coasters",    price: 39,  compareAt: 49,  image: "/best/best9.jpg",  cat: "Coasters" },
  { id: "p5", name: "Galaxy Tray",        price: 68,                  image: "/best/best7.jpg",  cat: "Trays" },
  { id: "p6", name: "Rose Quartz Clock",  price: 74,  compareAt: 92,  image: "/best/best6.jpg",  cat: "Clocks" },
  { id: "p7", name: "Aurora Wall Art",    price: 120,                 image: "/best/best8.jpg",  cat: "Wall Art" },
  { id: "p8", name: "Resin Keychain Set", price: 18,                  image: "/best/best2.jpg",  cat: "Keychains" },
  { id: "p9", name: "Gold Name Sign",     price: 95,  compareAt: 119, image: "/best/best4.jpg",  cat: "Name Signs" },
  { id: "p10", name: "Opal Pendant",      price: 34,                  image: "/best/best10.jpg", cat: "Jewelry" },
  { id: "p11", name: "Ocean Tray Set",    price: 88,  compareAt: 110, image: "/best/best11.jpg", cat: "Trays & Sets" },
];

const TOP_CATS   = ["All", "Clocks", "Tables", "Coasters", "Trays"];
const OTHER_CATS = ["Wall Art", "Keychains", "Name Signs", "Jewelry", "Trays & Sets"];

/* ---------- Touch-friendly card wrapper ---------- */
function AnimatedCard({ index, children }) {
  const canHover =
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <div
      style={{
        transform: "translateY(0) scale(1)",
        transition: "transform .22s ease, box-shadow .22s ease, filter .22s ease",
        animation: "fadeLift .45s ease both",
        animationDelay: `${index * 0.05}s`,
        borderRadius: 14,
        padding: canHover ? 0 : 1,
      }}
      onMouseEnter={(e) => {
        if (!canHover) return;
        e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        if (!canHover) return;
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Product card (clickable + Add to Cart) ---------- */
function ShopCard({ item, isMobile, onAdd }) {
  const onSale =
    typeof item.compareAt === "number" && item.compareAt > item.price;
  const pct = onSale
    ? Math.round(((item.compareAt - item.price) / item.compareAt) * 100)
    : 0;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #ece5f2",
      }}
    >
      {/* SALE badge */}
      {onSale && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: "5px 8px",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            borderRadius: 10,
            background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
            boxShadow: "0 6px 14px rgba(0,0,0,.12)",
            letterSpacing: 0.3,
            zIndex: 2,
          }}
        >
          -{pct}%
        </div>
      )}

      {/* Image (clickable) */}
      <Link
        to={`/product/${item.id}`}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
        aria-label={`View ${item.name}`}
      >
        <div style={{ aspectRatio: "4/5", background: "#f7f3fa" }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        </div>
      </Link>

      {/* Text + Button */}
      <div style={{ padding: isMobile ? 10 : 12, display: "grid", gap: 8 }}>
        {/* Name (clickable) */}
        <Link
          to={`/product/${item.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: isMobile ? 13.5 : 14.5,
              lineHeight: 1.25,
              minHeight: isMobile ? 0 : 34,
            }}
          >
            {item.name}
          </div>
        </Link>

        {/* Price line */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: isMobile ? 15 : 16,
              color: colors.vividPurple,
            }}
          >
            ${item.price.toFixed(2)}
          </span>
          {onSale && (
            <span
              style={{
                fontSize: isMobile ? 12.5 : 13.5,
                color: "#9b8cab",
                textDecoration: "line-through",
              }}
            >
              ${item.compareAt.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAdd(item)}
          style={{
            marginTop: 2,
            width: "100%",
            border: "none",
            borderRadius: 10,
            height: isMobile ? 42 : 38,
            fontWeight: 800,
            fontSize: isMobile ? 13.5 : 13,
            letterSpacing: 0.4,
            cursor: "pointer",
            color: "#fff",
            background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
            boxShadow: "0 6px 16px rgba(102, 51, 153, .18)",
            transition:
              "transform .15s ease, box-shadow .15s ease, opacity .15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ADD TO CART
        </button>
      </div>
    </div>
  );
}

/* ---------- Simple, reliable TabBar with 'Other ▾' ---------- */
function TabBar({ cat, setCat, isMobile }) {
  const [otherOpen, setOtherOpen] = useState(false);

  const baseBtn = (active) => ({
    border: "none",
    background: "transparent",
    color: active ? colors.vividPurple : "#222",
    padding: isMobile ? "8px 10px" : "10px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: isMobile ? 13 : 14,
    letterSpacing: 0.2,
    transition: "color .2s ease, background .2s ease",
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
      }}
    >
      {/* Top categories */}
      {TOP_CATS.map((c) => (
        <button
          key={c}
          onClick={() => {
            setCat(c);
            setOtherOpen(false);
          }}
          style={baseBtn(c === cat)}
        >
          {c}
        </button>
      ))}

      {/* Other dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOtherOpen((v) => !v)}
          style={baseBtn(OTHER_CATS.includes(cat))}
        >
          Other ▾
        </button>

        {otherOpen && (
          <div
            style={{
              position: "absolute",
              zIndex: 9999,
              top: "calc(100% + 6px)",
              left: 0,
              minWidth: isMobile ? "min(86vw, 260px)" : 200,
              background: "#fff",
              border: "1px solid #e6e1ea",
              borderRadius: 12,
              boxShadow: "0 18px 36px rgba(0,0,0,.12)",
              overflow: "hidden",
            }}
          >
            {OTHER_CATS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCat(c);
                  setOtherOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  background: cat === c ? "#f3ecf8" : "#fff",
                  border: "none",
                  cursor: "pointer",
                  color: cat === c ? colors.vividPurple : "#333",
                  fontSize: 13.5,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Shop page ---------- */
export default function Shop() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm; // < 768px

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  // cart mirrored with localStorage
  const [cart, setCart] = useState([]);

  // Load cart on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const handleAdd = (item) => {
    const key = "cart_v1";
    const arr = (() => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], qty: (arr[idx].qty || 1) + 1 };
    } else {
      arr.push({
        id: item.id,
        name: item.name,
        price: item.price,
        compareAt: item.compareAt,
        image: item.image,
        qty: 1,
      });
    }

    localStorage.setItem(key, JSON.stringify(arr));
    setCart(arr); // update local state too

    try {
      window.navigator.vibrate?.(10);
    } catch {
      /* ignore */
    }
  };

  const pageSize = isMobile ? 8 : 12;
  useEffect(() => setPage(1), [cat, query, sort, isMobile]);

  const cols = bp.xs ? 2 : bp.sm ? 2 : 4;

  const visible = useMemo(() => {
    let data = [...CATALOG];
    if (cat !== "All") data = data.filter((p) => p.cat === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cat.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "price_asc":
        data.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        data.sort((a, b) => b.price - a.price);
        break;
      case "name":
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break; // popular
    }
    return data;
  }, [query, cat, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = visible.slice(start, start + pageSize);

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  return (
    <main>
      <style>{`
        @keyframes fadeLift {
          0% { opacity: 0; transform: translateY(10px) scale(.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url(/hero.jpeg) center/cover no-repeat",
          color: "#fff",
          minHeight: isMobile ? 140 : 200,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          paddingTop: "clamp(84px, 14vw, 120px)",
          paddingBottom: isMobile ? 14 : 24,
          paddingInline: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 22 : 36,
              lineHeight: 1.15,
              textShadow: "0 2px 14px rgba(0,0,0,.32)",
            }}
          >
            Shop the Collection
          </h1>
          <p
            style={{
              marginTop: 6,
              opacity: 0.95,
              fontSize: isMobile ? 12.5 : 14.5,
            }}
          >
            Handcrafted resin pieces — made with heart, designed to shine.
          </p>
        </div>
      </section>

      {/* Sticky Filters */}
      <section
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#f6f3f8",
          padding: isMobile ? "8px 10px" : "10px 16px",
          borderBottom: "1px solid #e6e1ea",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
            gap: isMobile ? 8 : 10,
            alignItems: "center",
          }}
        >
          <TabBar cat={cat} setCat={setCat} isMobile={isMobile} />

          {/* Controls */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "auto auto",
              gridAutoFlow: isMobile ? "row" : "column",
              gap: 6,
              justifyContent: isMobile ? "stretch" : "flex-end",
              alignItems: "center",
            }}
          >
            <input
              type="search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: 10,
                border: "1px solid #d9d2df",
                background: "#fff",
                fontSize: isMobile ? 13 : 14,
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: 10,
                border: "1px solid #d9d2df",
                background: "#fff",
                fontSize: isMobile ? 13 : 14,
              }}
            >
              <option value="popular">Sort: Popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section
        style={{
          background: "#faf9fb",
          padding: isMobile ? "12px 10px 56px" : "28px 16px 70px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* mini cart count */}
          {cartCount > 0 && (
            <div
              style={{
                marginBottom: 10,
                fontSize: isMobile ? 12.5 : 13,
                color: "#6a5680",
              }}
            >
              {cartCount} item{cartCount > 1 ? "s" : ""} added to cart
            </div>
          )}

          {pageItems.length === 0 ? (
            <div
              style={{
                padding: isMobile ? 16 : 24,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #e6e1ea",
                textAlign: "center",
                fontSize: isMobile ? 13 : 14,
              }}
            >
              No products found. Try a different search or category.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: isMobile ? 10 : 14,
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
              }}
            >
              {pageItems.map((item, i) => (
                <AnimatedCard key={item.id} index={i}>
                  <ShopCard
                    item={item}
                    isMobile={isMobile}
                    onAdd={handleAdd}
                  />
                </AnimatedCard>
              ))}
            </div>
          )}

          {/* Pagination */}
          {visible.length > pageSize && (
            <div
              style={{
                marginTop: isMobile ? 12 : 16,
                display: "flex",
                justifyContent: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d9d2df",
                  background: page === 1 ? "#f0eef3" : "#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: isMobile ? 13 : 13.5,
                }}
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const num = idx + 1;
                const active = num === page;
                if (
                  num === 1 ||
                  num === totalPages ||
                  Math.abs(num - page) <= 1 ||
                  (page <= 2 && num <= 3) ||
                  (page >= totalPages - 1 && num >= totalPages - 2)
                ) {
                  return (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${
                          active ? "#c7b4d6" : "#d9d2df"
                        }`,
                        background: active ? "#efe7f6" : "#fff",
                        fontWeight: active ? 800 : 600,
                        cursor: "pointer",
                        fontSize: isMobile ? 13 : 13.5,
                      }}
                    >
                      {num}
                    </button>
                  );
                }
                if (num === page - 2 || num === page + 2) {
                  return (
                    <span
                      key={`dots-${num}`}
                      style={{ padding: "6px 4px", opacity: 0.6 }}
                    >
                      …
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d9d2df",
                  background: page === totalPages ? "#f0eef3" : "#fff",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontSize: isMobile ? 13 : 13.5,
                }}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
