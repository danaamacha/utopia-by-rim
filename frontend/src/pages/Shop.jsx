// frontend/src/pages/Shop.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { getProducts } from "../api/products";
import { addToCart, getCart } from "../api/cart";
import { useAuth } from "../auth/AuthContext";

// ✅ Reuse the same resolver used in admin edit (so uploads show everywhere)
import { resolveImageUrl, pickProductImage } from "./admin/adminProductsUtils";

const TOP_CATS = ["All", "Clocks", "Tables", "Coasters", "Trays"];
const OTHER_CATS = ["Wall Art", "Keychains", "Name Signs", "Jewelry", "Trays & Sets"];

/* ---------- helpers ---------- */
const norm = (s) => String(s ?? "").trim().toLowerCase();

/* ---------- Toast ---------- */
function Toast({ toasts }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 14,
            background:
              t.type === "success"
                ? "linear-gradient(90deg, #7c51a1, #4a2a73)"
                : "linear-gradient(90deg, #c62828, #b71c1c)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            animation: "toastIn .3s ease",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>
            {t.type === "success" ? "✓" : "✕"}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  }, []);
  return { toasts, showToast };
}

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

/* ---------- Product card ---------- */
function ShopCard({ item, isMobile, onAdd, adding }) {
  const [imgFailed, setImgFailed] = useState(false);

  const onSale =
    typeof item.compareAt === "number" && item.compareAt > item.price;
  const pct = onSale
    ? Math.round(((item.compareAt - item.price) / item.compareAt) * 100)
    : 0;

  const href = item.slug ? `/product/${item.slug}` : "#";
  const hasImage = Boolean(item.image) && !imgFailed;
  const isAdding = adding === item.id;

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

      <Link
        to={href}
        onClick={(e) => {
          if (!item.slug) {
            e.preventDefault();
          }
        }}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
        aria-label={`View ${item.name}`}
      >
        <div
          style={{
            aspectRatio: "4/5",
            background: "#f7f3fa",
            display: "grid",
            placeItems: "center",
          }}
        >
          {hasImage ? (
            <img
              src={item.image}
              alt={item.name || "Product image"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "#6b5a7a",
                fontWeight: 800,
                fontSize: isMobile ? 12.5 : 13,
              }}
            >
              {item.name ? item.name : "No image"}
            </div>
          )}
        </div>
      </Link>

      <div style={{ padding: isMobile ? 10 : 12, display: "grid", gap: 8 }}>
        <Link
          to={href}
          onClick={(e) => {
            if (!item.slug) {
              e.preventDefault();
            }
          }}
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

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: isMobile ? 15 : 16,
              color: colors.vividPurple,
            }}
          >
            ${Number(item.price).toFixed(2)}
          </span>
          {onSale && (
            <span
              style={{
                fontSize: isMobile ? 12.5 : 13.5,
                color: "#9b8cab",
                textDecoration: "line-through",
              }}
            >
              ${Number(item.compareAt).toFixed(2)}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd(item);
          }}
          disabled={isAdding}
          style={{
            marginTop: 2,
            width: "100%",
            border: "none",
            borderRadius: 10,
            height: isMobile ? 42 : 38,
            fontWeight: 800,
            fontSize: isMobile ? 13.5 : 13,
            letterSpacing: 0.4,
            cursor: isAdding ? "not-allowed" : "pointer",
            color: "#fff",
            background: isAdding
              ? "rgba(124,81,161,0.5)"
              : `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
            boxShadow: "0 6px 16px rgba(102, 51, 153, .18)",
            transition: "transform .15s ease, box-shadow .15s ease, opacity .15s ease",
          }}
          onMouseDown={(e) => { if (!isAdding) e.currentTarget.style.transform = "scale(.98)"; }}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isAdding ? "Adding…" : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}

/* ---------- TabBar ---------- */
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const { isAuthenticated } = useAuth();
  const { toasts, showToast } = useToast();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);
  const [adding, setAdding] = useState(null); // product id currently being added

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        const res = await getProducts({});
        const list = Array.isArray(res) ? res : res?.data ?? [];

        const transformed = list.map((p) => {
          const img = resolveImageUrl(pickProductImage(p));

          // ✅ collect ALL categories (many-to-many safe)
          const cats = Array.isArray(p.categories)
            ? p.categories
                .map((c) => ({
                  id: c?.id,
                  name: c?.name,
                  slug: c?.slug,
                }))
                .filter((c) => c.name || c.slug)
            : [];

          // fallback single category shapes (if backend ever returns)
          if (cats.length === 0 && (p.category || p.cat)) {
            cats.push({ name: p.category || p.cat, slug: p.category || p.cat });
          }

          // used for search display (first category only)
          const primaryCat = cats[0]?.name || "Other";

          return {
            id: p.id,
            name: p.name,
            price: Number(p.salePrice ?? p.price ?? 0),
            compareAt: p.salePrice != null ? Number(p.price ?? 0) : null,
            image: img,
            slug: p.slug,

            // ✅ store full categories array for filtering
            categories: cats,

            // ✅ keep one string for UI/search display
            cat: primaryCat,
          };
        });

        setProducts(transformed);
      } catch (err) {
        console.error("Failed to load products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    async function loadCartCount() {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }
      try {
        const cart = await getCart();
        const count = (cart?.items || []).reduce(
          (sum, it) => sum + Number(it.quantity || 0),
          0
        );
        setCartCount(count);
      } catch (err) {
        console.error("Failed to load cart:", err);
        setCartCount(0);
      }
    }
    loadCartCount();
  }, [isAuthenticated]);

  const handleAdd = async (item) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to cart", "error");
      navigate("/login");
      return;
    }

    setAdding(item.id);
    try {
      await addToCart(item.id, 1);

      const cart = await getCart();
      const count = (cart?.items || []).reduce(
        (sum, it) => sum + Number(it.quantity || 0),
        0
      );
      setCartCount(count);

      showToast(`${item.name} added to cart ✓`, "success");
      window.navigator.vibrate?.(10);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showToast(err?.message || "Failed to add to cart", "error");
    } finally {
      setAdding(null);
    }
  };

  const pageSize = isMobile ? 8 : 12;
  useEffect(() => setPage(1), [cat, query, sort, isMobile]);

  const cols = bp.xs ? 2 : bp.sm ? 2 : 4;

  const visible = useMemo(() => {
    let data = [...products];

    // ✅ FIXED: filter by ANY category (name OR slug), not only first one
    if (cat !== "All") {
      const target = norm(cat);
      data = data.filter((p) =>
        (p.categories || []).some(
          (c) => norm(c.name) === target || norm(c.slug) === target
        )
      );
    }

    if (query.trim()) {
      const q = norm(query);
      data = data.filter((p) => {
        const nameMatch = norm(p.name).includes(q);

        // search in ALL categories too
        const catMatch = (p.categories || []).some(
          (c) => norm(c.name).includes(q) || norm(c.slug).includes(q)
        );

        return nameMatch || catMatch;
      });
    }

    switch (sort) {
      case "price_asc":
        data.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        data.sort((a, b) => b.price - a.price);
        break;
      case "name":
        data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return data;
  }, [query, cat, sort, products]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = visible.slice(start, start + pageSize);

  return (
    <main>
      <style>{`
        @keyframes fadeLift {
          0% { opacity: 0; transform: translateY(10px) scale(.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Toast notifications */}
      <Toast toasts={toasts} />

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
          {cartCount > 0 && (
            <div
              style={{
                marginBottom: 10,
                fontSize: isMobile ? 12.5 : 13,
                color: "#6a5680",
              }}
            >
              {cartCount} item{cartCount > 1 ? "s" : ""} in cart
            </div>
          )}

          {loading ? (
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
              Loading products…
            </div>
          ) : pageItems.length === 0 ? (
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
                    adding={adding}
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