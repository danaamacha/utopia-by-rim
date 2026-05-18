// frontend/src/pages/ProductDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CATALOG, getProductById } from "../data/catalog";
import BestSellerCard from "../components/BestSellerCard";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";

/* ---------------- helpers ---------------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- cart LS helpers (must match Cart.jsx) ----
const LS_KEY = "cart_v1";
function readCart() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}
function optionKey(obj) {
  // stable key for selected options (so different option combos are separate lines)
  return Object.keys(obj || {})
    .sort()
    .map((k) => `${k}:${obj[k]}`)
    .join("|");
}

export default function ProductDetails() {
  const { id } = useParams();
  const product = getProductById(id);
  const nav = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  useEffect(() => window.scrollTo(0, 0), [id]);

  if (!product) {
    return (
      <main style={{ padding: "120px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2>Product not found</h2>
          <p>It looks like this item doesn’t exist or was removed.</p>
          <button
            onClick={() => nav(-1)}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #e6e1ea",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  /* ----- state ----- */
  const [mainImg, setMainImg] = useState(product.gallery?.[0] || product.image);
  const [qty, setQty] = useState(1);

  // options state: works with array-based options [{label, required, values:[{label, priceDelta?}]}]
  const [sel, setSel] = useState({});
  const [showOptionsError, setShowOptionsError] = useState(false);

  const hasSale =
    typeof product.salePrice === "number" && product.salePrice < product.price;

  // required groups & missing
  const requiredGroups = (product.options || []).filter((g) => g.required);
  const missingRequired = requiredGroups.filter((g) => !sel[g.label]);

  // compute final unit price with deltas
  const base = hasSale ? product.salePrice : product.price;
  const chosenDeltas = (product.options || []).flatMap((g) => {
    const v = sel[g.label];
    if (!v) return [];
    const found = g.values.find((x) => x.label === v);
    return found?.priceDelta ? [found.priceDelta] : [];
  });
  const finalPrice = base + chosenDeltas.reduce((a, b) => a + b, 0);

  const savingsPct = hasSale
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  const priceText = `$${finalPrice.toFixed(2)}`;

  const related = useMemo(() => {
    const same = CATALOG.filter((p) => p.cat === product.cat && p.id !== product.id);
    const rest = CATALOG.filter((p) => p.cat !== product.cat && p.id !== product.id);
    const pick = shuffle(same).slice(0, 4).concat(shuffle(rest).slice(0, 4));
    return shuffle(pick).slice(0, isMobile ? 4 : 6);
  }, [product.id, product.cat, isMobile]);
  const relCols = bp.xs ? 1 : bp.sm ? 2 : 3;

  const onAddToCart = () => {
  if (missingRequired.length > 0) {
    setShowOptionsError(true);
    document
      .querySelector("#options-start")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Create unique ID based on product + selected options
  const optKey = optionKey(sel);
  const lineId = optKey ? `${product.id}__${optKey}` : product.id;

  const item = {
    id: lineId,
    name: product.name,
    image: product.image,
    price: finalPrice,
    compareAt: hasSale ? product.price : undefined,
    qty,
    sku: product.id,
    options: sel,
    cat: product.cat,
  };

  const items = readCart();
  const existing = items.find((x) => x.id === lineId);

  if (existing) {
    existing.qty = Math.max(1, (existing.qty || 1) + qty);
  } else {
    items.push(item);
  }

  writeCart(items);

  // ✅ Just show a small confirmation – no navigation
  alert("Added to cart ✓");
};


  const shareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      alert(url);
    }
  };

  const Stars = ({ value = 4.7 }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const active = i < full || (i === full && half);
          return (
            <span
              key={i}
              style={{ fontSize: 16, color: active ? "#f5a524" : "#d8d2e0" }}
            >
              ★
            </span>
          );
        })}
        <span style={{ fontSize: 13, color: "#6f6280" }}>
          {value.toFixed(1)} • 32 reviews
        </span>
      </div>
    );
  };

  return (
    <main>
      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(/hero.jpeg) center/cover no-repeat",
          color: "#fff",
          minHeight: isMobile ? 140 : 200,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          paddingTop: "clamp(90px, 14vw, 120px)",
          paddingBottom: isMobile ? 16 : 26,
          paddingInline: 16,
        }}
      >
        <div style={{ maxWidth: 1100, width: "100%" }}>
          <nav style={{ fontSize: 13, opacity: 0.9, textAlign: "left" }}>
            <Link to="/" style={{ color: "#fff" }}>
              Home
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link to="/shop" style={{ color: "#fff" }}>
              Shop
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link to="/shop" style={{ color: "#fff" }}>
              {product.cat}
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ opacity: 0.9 }}>{product.name}</span>
          </nav>
          <h1 style={{ margin: "8px 0 0", fontSize: isMobile ? 24 : 36 }}>
            {product.name}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section
        style={{
          background: "#faf9fb",
          padding: isMobile ? "16px 12px 40px" : "40px 20px 70px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            gap: isMobile ? 16 : 26,
          }}
        >
          {/* Left: Full Image Card */}
          <div>
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid #eee6f5",
                boxShadow: "0 8px 24px rgba(102, 51, 153, 0.1)",
                background: "#fff",
                aspectRatio: isMobile ? "1/1" : "4/3",
              }}
            >
              <img
                src={mainImg}
                alt={product.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform .35s ease",
                }}
                onMouseOver={(e) =>
                  !isMobile && (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseOut={(e) =>
                  !isMobile && (e.currentTarget.style.transform = "scale(1)")
                }
              />

              {hasSale && (
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    background: "#ff4d4f",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 12,
                    boxShadow: "0 6px 16px rgba(0,0,0,.15)",
                  }}
                >
                  Save {savingsPct}%
                </div>
              )}

              <button
                onClick={shareLink}
                title="Copy link"
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "rgba(255,255,255,.9)",
                  border: "1px solid #e6e1ea",
                  borderRadius: 999,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Share ⤴
              </button>
            </div>

            {/* Thumbnails */}
            {product.gallery && product.gallery.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {product.gallery.map((g) => {
                  const active = mainImg === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setMainImg(g)}
                      style={{
                        border: active
                          ? `2px solid ${colors.vividPurple}`
                          : "1px solid #ddd",
                        borderRadius: 14,
                        overflow: "hidden",
                        padding: 0,
                        background: "#fff",
                        cursor: "pointer",
                        width: isMobile ? 64 : 78,
                        height: isMobile ? 64 : 78,
                      }}
                      aria-label="Change image"
                    >
                      <img
                        src={g}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Buy Box */}
          <div
            style={{
              position: isMobile ? "static" : "sticky",
              top: isMobile ? 0 : 92,
              alignSelf: "start",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e6e1ea",
                borderRadius: 20,
                padding: isMobile ? 14 : 22,
                boxShadow: "0 18px 36px rgba(102,51,153,.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stars />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#2a9248",
                    background: "#eaf8ef",
                    border: "1px solid #d2eedb",
                    padding: "6px 10px",
                    borderRadius: 999,
                  }}
                >
                  In stock
                </span>
              </div>

              {/* Price row (uses finalPrice) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 24 : 32,
                    fontWeight: 900,
                    color: colors.royalPlum,
                  }}
                >
                  {priceText}
                </div>
                {hasSale && (
                  <div
                    style={{
                      textDecoration: "line-through",
                      opacity: 0.6,
                      fontSize: isMobile ? 14 : 16,
                    }}
                  >
                    ${product.price.toFixed(2)}
                  </div>
                )}
              </div>

              {product.short && (
                <p style={{ marginTop: 10, opacity: 0.9, fontSize: 14 }}>
                  {product.short}
                </p>
              )}

              {/* OPTIONS */}
              <div id="options-start" />
              {Array.isArray(product.options) && product.options.length > 0 && (
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {product.options.map((group) => (
                    <div key={group.label}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#3c2d4f",
                          }}
                        >
                          {group.label}
                        </div>
                        {group.required && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#a25555",
                              background: "#fdecec",
                              border: "1px solid #f7d2d2",
                              borderRadius: 999,
                              padding: "2px 8px",
                            }}
                          >
                            Required
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {group.values.map((val) => {
                          const active = sel[group.label] === val.label;
                          const delta = val.priceDelta || 0;
                          return (
                            <button
                              key={val.label}
                              onClick={() => {
                                setSel((s) => ({ ...s, [group.label]: val.label }));
                                setShowOptionsError(false);
                              }}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 999,
                                border: active
                                  ? `2px solid ${colors.vividPurple}`
                                  : "1px solid #e6e1ea",
                                background: active ? "#f4ecfb" : "#fff",
                                fontSize: 13,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                              aria-pressed={active}
                            >
                              {val.label}
                              {delta ? ` (+$${delta})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {showOptionsError && missingRequired.length > 0 && (
                    <div style={{ color: "#b03a3a", fontSize: 12.5, marginTop: 2 }}>
                      Please choose: {missingRequired.map((g) => g.label).join(", ")}.
                    </div>
                  )}
                </div>
              )}

              {/* Qty + Add to Cart */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "auto 1fr",
                  gap: 10,
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid #e1dbe8",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fafafa",
                  }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    style={{
                      width: 64,
                      textAlign: "center",
                      border: "none",
                      background: "transparent",
                      padding: "10px 0",
                      fontSize: 16,
                    }}
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    style={{
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={onAddToCart}
                  style={{
                    width: "100%",
                    background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
                    color: "#fff",
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 900,
                    letterSpacing: 0.3,
                    boxShadow: "0 10px 22px rgba(102,51,153,.18)",
                  }}
                >
                  Add to cart
                </button>
              </div>

              {/* Trust badges */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 14,
                  fontSize: 12.5,
                  color: "#6f6280",
                }}
              >
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
              {product.specs && Object.keys(product.specs).length > 0 && (
                <Accordion title="Specifications">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          background: "#fff",
                          border: "1px solid #eee7f2",
                          borderRadius: 12,
                          padding: "10px 12px",
                        }}
                      >
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

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "38px auto 0" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>You may also like</h3>
            <div
              style={{
                display: "grid",
                gap: isMobile ? 14 : 20,
                gridTemplateColumns: `repeat(${relCols}, 1fr)`,
              }}
            >
              {related.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <BestSellerCard
                    image={p.image}
                    name={p.name}
                    price={p.salePrice ?? p.price}
                    salePrice={p.salePrice}
                    index={i}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

/* Accordion Component */
function Accordion({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        border: "1px solid #e6e1ea",
        borderRadius: 14,
        background: "#fff",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.6 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 14px 14px" }}>{children}</div>}
    </div>
  );
}

const pill = {
  background: "#fff",
  border: "1px solid #e6e1ea",
  borderRadius: 999,
  padding: "8px 10px",
  textAlign: "center",
};
