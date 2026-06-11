import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { useCart } from "../cart/CartContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getImage(product) {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  if (primary?.url) {
    return primary.url.startsWith("http") ? primary.url : `${API_BASE.replace("/api", "")}${primary.url}`;
  }
  return "/best/best1.jpg";
}

function AnimatedCard({ index, children }) {
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  return (
    <div
      style={{ animation: `fadeLift .45s ease both`, animationDelay: `${index * 0.05}s`, borderRadius: 14 }}
      onMouseEnter={(e) => { if (canHover) { e.currentTarget.style.transform = "translateY(-4px) scale(1.01)"; e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,.12)"; }}}
      onMouseLeave={(e) => { if (canHover) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}}
    >
      {children}
    </div>
  );
}

function ShopCard({ item, isMobile, onAdd }) {
  const onSale = item.salePrice != null && Number(item.salePrice) < Number(item.price);
  const displayPrice = onSale ? Number(item.salePrice) : Number(item.price);
  const pct = onSale ? Math.round(((Number(item.price) - Number(item.salePrice)) / Number(item.price)) * 100) : 0;
  const image = getImage(item);

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #ece5f2" }}>
      {onSale && (
        <div style={{ position: "absolute", top: 8, left: 8, padding: "5px 8px", fontSize: 11, fontWeight: 800, color: "#fff", borderRadius: 10, background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`, zIndex: 2 }}>
          -{pct}%
        </div>
      )}
      <Link to={`/product/${item.slug}`} style={{ display: "block", textDecoration: "none" }} aria-label={`View ${item.name}`}>
        <div style={{ aspectRatio: "4/5", background: "#f7f3fa" }}>
          <img src={image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        </div>
      </Link>
      <div style={{ padding: isMobile ? 10 : 12, display: "grid", gap: 8 }}>
        <Link to={`/product/${item.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 13.5 : 14.5, lineHeight: 1.25, minHeight: isMobile ? 0 : 34 }}>
            {item.name}
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, color: colors.vividPurple }}>${displayPrice.toFixed(2)}</span>
          {onSale && <span style={{ fontSize: isMobile ? 12.5 : 13.5, color: "#9b8cab", textDecoration: "line-through" }}>${Number(item.price).toFixed(2)}</span>}
        </div>
        <button
          onClick={() => onAdd(item)}
          style={{ marginTop: 2, width: "100%", border: "none", borderRadius: 10, height: isMobile ? 42 : 38, fontWeight: 800, fontSize: isMobile ? 13.5 : 13, letterSpacing: 0.4, cursor: "pointer", color: "#fff", background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`, boxShadow: "0 6px 16px rgba(102,51,153,.18)" }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ADD TO CART
        </button>
      </div>
    </div>
  );
}

function SkeletonCard({ isMobile }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #ece5f2" }}>
      <div style={{ aspectRatio: "4/5", background: "#f0ebf5", animation: "pulse 1.4s ease infinite" }} />
      <div style={{ padding: isMobile ? 10 : 12, display: "grid", gap: 8 }}>
        <div style={{ height: 16, background: "#f0ebf5", borderRadius: 8, animation: "pulse 1.4s ease infinite" }} />
        <div style={{ height: 14, width: "50%", background: "#f0ebf5", borderRadius: 8, animation: "pulse 1.4s ease infinite" }} />
        <div style={{ height: isMobile ? 42 : 38, background: "#f0ebf5", borderRadius: 10, animation: "pulse 1.4s ease infinite" }} />
      </div>
    </div>
  );
}

export default function Shop() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [addedId, setAddedId] = useState(null);

  const { add: addToCart, count: cartCount } = useCart();

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/products`)
      .then((r) => { if (!r.ok) throw new Error("Failed to load products"); return r.json(); })
      .then((data) => { setProducts(Array.isArray(data) ? data : data.data || []); })
      .catch(() => setError("Could not load products. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => p.categories?.forEach((c) => cats.add(c.name)));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const handleAdd = async (item) => {
    const ok = await addToCart(item, 1);
    if (!ok) return;
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
    try { window.navigator.vibrate?.(10); } catch {}
  };

  const pageSize = isMobile ? 8 : 12;
  useEffect(() => setPage(1), [cat, query, sort, isMobile]);
  const cols = bp.xs ? 2 : bp.sm ? 2 : 4;

  const visible = useMemo(() => {
    let data = [...products];
    if (cat !== "All") data = data.filter((p) => p.categories?.some((c) => c.name === cat));
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    switch (sort) {
      case "price_asc": data.sort((a, b) => Number(a.salePrice ?? a.price) - Number(b.salePrice ?? b.price)); break;
      case "price_desc": data.sort((a, b) => Number(b.salePrice ?? b.price) - Number(a.salePrice ?? a.price)); break;
      case "name": data.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return data;
  }, [products, query, cat, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main>
      <style>{`
        @keyframes fadeLift { 0% { opacity:0; transform:translateY(10px) scale(.98); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
      `}</style>

      {/* Hero */}
      <section style={{ background: "linear-gradient(rgba(0,0,0,.28),rgba(0,0,0,.28)),url(/hero.jpeg) center/cover no-repeat", color: "#fff", minHeight: isMobile ? 140 : 200, display: "grid", placeItems: "center", textAlign: "center", paddingTop: "clamp(84px,14vw,120px)", paddingBottom: isMobile ? 14 : 24, paddingInline: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 36, lineHeight: 1.15, textShadow: "0 2px 14px rgba(0,0,0,.32)" }}>Shop the Collection</h1>
          <p style={{ marginTop: 6, opacity: .95, fontSize: isMobile ? 12.5 : 14.5 }}>Handcrafted resin pieces — made with heart, designed to shine.</p>
        </div>
      </section>

      {/* Sticky Filters */}
      <section style={{ position: "sticky", top: 0, zIndex: 50, background: "#f6f3f8", padding: isMobile ? "8px 10px" : "10px 16px", borderBottom: "1px solid #e6e1ea", backdropFilter: "blur(6px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? 8 : 10, alignItems: "center" }}>
          {/* Category tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} style={{ border: "none", background: "transparent", color: cat === c ? colors.vividPurple : "#222", padding: isMobile ? "8px 10px" : "10px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 13 : 14, whiteSpace: "nowrap" }}>
                {c}
              </button>
            ))}
          </div>
          {/* Search + Sort */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto auto", gap: 6 }}>
            <input type="search" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #d9d2df", background: "#fff", fontSize: isMobile ? 13 : 14 }} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #d9d2df", background: "#fff", fontSize: isMobile ? 13 : 14 }}>
              <option value="popular">Sort: Popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ background: "#faf9fb", padding: isMobile ? "12px 10px 56px" : "28px 16px 70px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {cartCount > 0 && (
            <div style={{ marginBottom: 10, fontSize: isMobile ? 12.5 : 13, color: "#6a5680" }}>
              {cartCount} item{cartCount !== 1 ? "s" : ""} in cart —{" "}
              <Link to="/cart" style={{ color: colors.vividPurple, fontWeight: 700 }}>View cart</Link>
            </div>
          )}

          {error && (
            <div style={{ padding: 20, borderRadius: 12, background: "#fff2f2", border: "1px solid #f5c2c2", color: "#a33", textAlign: "center" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "grid", gap: isMobile ? 10 : 14, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} isMobile={isMobile} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <div style={{ padding: isMobile ? 16 : 24, borderRadius: 12, background: "#fff", border: "1px solid #e6e1ea", textAlign: "center", fontSize: isMobile ? 13 : 14 }}>
              No products found. Try a different search or category.
            </div>
          ) : (
            <div style={{ display: "grid", gap: isMobile ? 10 : 14, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {pageItems.map((item, i) => (
                <AnimatedCard key={item.id} index={i}>
                  <ShopCard item={item} isMobile={isMobile} onAdd={handleAdd} />
                </AnimatedCard>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && visible.length > pageSize && (
            <div style={{ marginTop: isMobile ? 12 : 16, display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #d9d2df", background: page === 1 ? "#f0eef3" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer" }}>‹ Prev</button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const num = idx + 1;
                if (num === 1 || num === totalPages || Math.abs(num - page) <= 1) {
                  return <button key={num} onClick={() => setPage(num)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${num === page ? "#c7b4d6" : "#d9d2df"}`, background: num === page ? "#efe7f6" : "#fff", fontWeight: num === page ? 800 : 600, cursor: "pointer" }}>{num}</button>;
                }
                if (num === page - 2 || num === page + 2) return <span key={`d${num}`} style={{ padding: "6px 4px", opacity: .6 }}>…</span>;
                return null;
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #d9d2df", background: page === totalPages ? "#f0eef3" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer" }}>Next ›</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
