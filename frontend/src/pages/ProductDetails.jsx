import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";
import { useCart } from "../cart/CartContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getImage(product) {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  if (primary?.url) {
    return primary.url.startsWith("http") ? primary.url : `${API_BASE.replace("/api", "")}${primary.url}`;
  }
  return "/best/best1.jpg";
}

function getAllImages(product) {
  if (!product.images?.length) return ["/best/best1.jpg"];
  return product.images
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((i) => (i.url.startsWith("http") ? i.url : `${API_BASE.replace("/api", "")}${i.url}`));
}

function optionKey(obj) {
  return Object.keys(obj || {}).sort().map((k) => `${k}:${obj[k]}`).join("|");
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function ProductDetails() {
  const { id: slug } = useParams();
  const nav = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const { add: addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mainImg, setMainImg] = useState("");
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState({});
  const [showOptionsError, setShowOptionsError] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");

  useEffect(() => window.scrollTo(0, 0), [slug]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setProduct(null);
    setSel({});
    setQty(1);

    Promise.all([
      fetch(`${API_BASE}/products/slug/${slug}`).then((r) => { if (!r.ok) throw new Error("not_found"); return r.json(); }),
      fetch(`${API_BASE}/products`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([prod, all]) => {
        setProduct(prod);
        setMainImg(getImage(prod));
        setAllProducts(Array.isArray(all) ? all : all.data || []);
      })
      .catch((e) => setError(e.message === "not_found" ? "Product not found." : "Failed to load product."))
      .finally(() => setLoading(false));
  }, [slug]);

  const options = product?.metadata?.options || [];
  const specs = product?.metadata?.specs || {};
  const shortDesc = product?.metadata?.short || "";
  const gallery = product ? getAllImages(product) : [];

  const hasSale = product && product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const base = product ? (hasSale ? Number(product.salePrice) : Number(product.price)) : 0;
  const chosenDeltas = options.flatMap((g) => {
    const v = sel[g.label];
    if (!v) return [];
    const found = g.values?.find((x) => x.label === v);
    return found?.priceDelta ? [found.priceDelta] : [];
  });
  const finalPrice = base + chosenDeltas.reduce((a, b) => a + b, 0);
  const savingsPct = hasSale ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100) : 0;
  const requiredGroups = options.filter((g) => g.required);
  const missingRequired = requiredGroups.filter((g) => !sel[g.label]);

  const related = useMemo(() => {
    if (!product) return [];
    const myCats = new Set(product.categories?.map((c) => c.id));
    const same = allProducts.filter((p) => p.id !== product.id && p.categories?.some((c) => myCats.has(c.id)));
    const rest = allProducts.filter((p) => p.id !== product.id && !p.categories?.some((c) => myCats.has(c.id)));
    return shuffle([...shuffle(same).slice(0, 4), ...shuffle(rest).slice(0, 4)]).slice(0, isMobile ? 4 : 6);
  }, [product, allProducts, isMobile]);
  const relCols = bp.xs ? 1 : bp.sm ? 2 : 3;

  const onAddToCart = async () => {
    if (!product) return;
    if (missingRequired.length > 0) {
      setShowOptionsError(true);
      document.querySelector("#options-start")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const optKey = optionKey(sel);
    const lineId = optKey ? `${product.id}__${optKey}` : product.id;
    const ok = await addToCart(product, qty, {
      id: lineId,
      image: mainImg,
      price: finalPrice,
      compareAt: hasSale ? Number(product.price) : undefined,
      options: sel,
    });
    if (!ok) { setAddedMsg("Could not add to cart"); setTimeout(() => setAddedMsg(""), 2500); return; }
    setAddedMsg("Added to cart ✓");
    setTimeout(() => setAddedMsg(""), 2500);
  };

  const shareLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setAddedMsg("Link copied!"); setTimeout(() => setAddedMsg(""), 2000); }
    catch { alert(window.location.href); }
  };

  if (loading) return (
    <main style={{ paddingTop: 120, paddingInline: 20, minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${colors.vividPurple}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#6a5680", margin: 0 }}>Loading product…</p>
      </div>
    </main>
  );

  if (error) return (
    <main style={{ padding: "120px 20px", minHeight: "60vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h2>{error}</h2>
        <p>This item may not exist or was removed.</p>
        <button onClick={() => nav("/shop")} style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid #e6e1ea", background: "#fff", cursor: "pointer", fontWeight: 700 }}>← Back to shop</button>
      </div>
    </main>
  );

  const catName = product.categories?.[0]?.name || "All";

  return (
    <main>
      {/* Hero */}
      <section style={{ background: "linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url(/hero.jpeg) center/cover no-repeat", color: "#fff", minHeight: isMobile ? 140 : 200, display: "grid", placeItems: "center", textAlign: "center", paddingTop: "clamp(90px,14vw,120px)", paddingBottom: isMobile ? 16 : 26, paddingInline: 16 }}>
        <div style={{ maxWidth: 1100, width: "100%" }}>
          <nav style={{ fontSize: 13, opacity: 0.9, textAlign: "left" }}>
            <Link to="/" style={{ color: "#fff" }}>Home</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link to="/shop" style={{ color: "#fff" }}>Shop</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link to="/shop" style={{ color: "#fff" }}>{catName}</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ opacity: 0.9 }}>{product.name}</span>
          </nav>
          <h1 style={{ margin: "8px 0 0", fontSize: isMobile ? 24 : 36 }}>{product.name}</h1>
        </div>
      </section>

      {/* Main */}
      <section style={{ background: "#faf9fb", padding: isMobile ? "16px 12px 40px" : "40px 20px 70px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr", gap: isMobile ? 16 : 26 }}>
          {/* Left: Image */}
          <div>
            <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: "1px solid #eee6f5", boxShadow: "0 8px 24px rgba(102,51,153,.1)", background: "#fff", aspectRatio: isMobile ? "1/1" : "4/3" }}>
              <img src={mainImg} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transition: "transform .35s ease" }}
                onMouseOver={(e) => !isMobile && (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseOut={(e) => !isMobile && (e.currentTarget.style.transform = "scale(1)")}
              />
              {hasSale && <div style={{ position: "absolute", top: 20, left: 20, background: "#ff4d4f", color: "#fff", padding: "8px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12, boxShadow: "0 6px 16px rgba(0,0,0,.15)" }}>Save {savingsPct}%</div>}
              <button onClick={shareLink} title="Copy link" style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.9)", border: "1px solid #e6e1ea", borderRadius: 999, padding: "8px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Share ⤴</button>
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {gallery.map((g) => {
                  const active = mainImg === g;
                  return (
                    <button key={g} onClick={() => setMainImg(g)} style={{ border: active ? `2px solid ${colors.vividPurple}` : "1px solid #ddd", borderRadius: 14, overflow: "hidden", padding: 0, background: "#fff", cursor: "pointer", width: isMobile ? 64 : 78, height: isMobile ? 64 : 78 }} aria-label="Change image">
                      <img src={g} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Buy box */}
          <div style={{ position: isMobile ? "static" : "sticky", top: isMobile ? 0 : 92, alignSelf: "start" }}>
            <div style={{ background: "#fff", border: "1px solid #e6e1ea", borderRadius: 20, padding: isMobile ? 14 : 22, boxShadow: "0 18px 36px rgba(102,51,153,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Stars />
                <span style={{ fontSize: 12, fontWeight: 800, color: product.stockQuantity > 0 ? "#2a9248" : "#a33", background: product.stockQuantity > 0 ? "#eaf8ef" : "#fff2f2", border: `1px solid ${product.stockQuantity > 0 ? "#d2eedb" : "#f5c2c2"}`, padding: "6px 10px", borderRadius: 999 }}>
                  {product.stockQuantity > 0 ? "In stock" : "Out of stock"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: colors.royalPlum }}>${finalPrice.toFixed(2)}</div>
                {hasSale && <div style={{ textDecoration: "line-through", opacity: 0.6, fontSize: isMobile ? 14 : 16 }}>${Number(product.price).toFixed(2)}</div>}
              </div>

              {shortDesc && <p style={{ marginTop: 10, opacity: 0.9, fontSize: 14 }}>{shortDesc}</p>}

              {/* Options */}
              <div id="options-start" />
              {options.length > 0 && (
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {options.map((group) => (
                    <div key={group.label}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#3c2d4f" }}>{group.label}</div>
                        {group.required && <span style={{ fontSize: 12, color: "#a25555", background: "#fdecec", border: "1px solid #f7d2d2", borderRadius: 999, padding: "2px 8px" }}>Required</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {group.values?.map((val) => {
                          const active = sel[group.label] === val.label;
                          return (
                            <button key={val.label} onClick={() => { setSel((s) => ({ ...s, [group.label]: val.label })); setShowOptionsError(false); }}
                              style={{ padding: "10px 12px", borderRadius: 999, border: active ? `2px solid ${colors.vividPurple}` : "1px solid #e6e1ea", background: active ? "#f4ecfb" : "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                              aria-pressed={active}>
                              {val.label}{val.priceDelta ? ` (+$${val.priceDelta})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {showOptionsError && missingRequired.length > 0 && <div style={{ color: "#b03a3a", fontSize: 12.5, marginTop: 2 }}>Please choose: {missingRequired.map((g) => g.label).join(", ")}.</div>}
                </div>
              )}

              {/* Qty + Add */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 10, alignItems: "center", marginTop: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #e1dbe8", borderRadius: 12, overflow: "hidden", background: "#fafafa" }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>−</button>
                  <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} style={{ width: 64, textAlign: "center", border: "none", background: "transparent", padding: "10px 0", fontSize: 16 }} />
                  <button onClick={() => setQty((q) => q + 1)} style={{ padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>+</button>
                </div>
                <button onClick={onAddToCart} disabled={product.stockQuantity <= 0}
                  style={{ width: "100%", background: product.stockQuantity > 0 ? `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})` : "#ccc", color: "#fff", padding: "12px 16px", borderRadius: 14, border: "none", cursor: product.stockQuantity > 0 ? "pointer" : "not-allowed", fontWeight: 900, letterSpacing: 0.3, boxShadow: product.stockQuantity > 0 ? "0 10px 22px rgba(102,51,153,.18)" : "none" }}>
                  {product.stockQuantity > 0 ? "Add to cart" : "Out of stock"}
                </button>
              </div>

              {addedMsg && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#eaf8ef", border: "1px solid #d2eedb", color: "#2a7248", fontWeight: 700, fontSize: 13, textAlign: "center" }}>{addedMsg}</div>}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, fontSize: 12.5, color: "#6f6280" }}>
                <div style={pill}>✓ 3–5 day shipping</div>
                <div style={pill}>✓ 7-day returns</div>
                <div style={pill}>✓ Secure checkout</div>
              </div>
            </div>

            {/* Description + Specs */}
            <div style={{ marginTop: 18 }}>
              {product.description && (
                <Accordion title="Description">
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{product.description}</p>
                </Accordion>
              )}
              {Object.keys(specs).length > 0 && (
                <Accordion title="Specifications">
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    {Object.entries(specs).map(([k, v]) => (
                      <div key={k} style={{ background: "#fff", border: "1px solid #eee7f2", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>{k}</div>
                        <div style={{ opacity: 0.9 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "38px auto 0" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>You may also like</h3>
            <div style={{ display: "grid", gap: isMobile ? 14 : 20, gridTemplateColumns: `repeat(${relCols}, 1fr)` }}>
              {related.map((p) => {
                const img = getImage(p);
                const relSale = p.salePrice != null && Number(p.salePrice) < Number(p.price);
                const relPrice = relSale ? Number(p.salePrice) : Number(p.price);
                return (
                  <Link key={p.id} to={`/product/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #ece5f2" }}>
                      <div style={{ aspectRatio: "4/5", background: "#f7f3fa" }}>
                        <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontWeight: 800, color: colors.vividPurple }}>${relPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Stars({ value = 4.7 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: 16, color: (i < full || (i === full && half)) ? "#f5a524" : "#d8d2e0" }}>★</span>
      ))}
      <span style={{ fontSize: 13, color: "#6f6280" }}>{value.toFixed(1)} • 32 reviews</span>
    </div>
  );
}

function Accordion({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: "1px solid #e6e1ea", borderRadius: 14, background: "#fff", overflow: "hidden", marginBottom: 10 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{title}</span>
        <span style={{ opacity: 0.6 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 14px 14px" }}>{children}</div>}
    </div>
  );
}

const pill = { background: "#fff", border: "1px solid #e6e1ea", borderRadius: 999, padding: "8px 10px", textAlign: "center" };
