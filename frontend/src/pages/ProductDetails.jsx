// frontend/src/pages/ProductDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import BestSellerCard from "../components/BestSellerCard";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";
import { getProductBySlug, getProducts } from "../api/products";
import { addToCart, getCart } from "../api/cart";
import { useAuth } from "../auth/AuthContext";

// ✅ Use the SAME resolver used in admin + shop
import { resolveImageUrl, pickProductImage } from "./admin/adminProductsUtils";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// StrictMode dev double-mount guard
const __fetchedSlugs = new Set();

// Fallback sizes (until backend provides)
const FALLBACK_SIZES = [
  { id: "S", label: "S", delta: 0 },
  { id: "M", label: "M (+$10)", delta: 10 },
  { id: "L", label: "L (+$20)", delta: 20 },
  { id: "XL", label: "XL (+$35)", delta: 35 },
];

export default function ProductDetails() {
  const { slug: rawSlug } = useParams();
  const nav = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const { isAuthenticated } = useAuth();

  const slug = useMemo(() => {
    const s = decodeURIComponent(rawSlug || "").trim();
    return s.replace(/\s+/g, "-").toLowerCase();
  }, [rawSlug]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  const [mainImg, setMainImg] = useState(null);
  const [qty, setQty] = useState(1);

  const [selectedSize, setSelectedSize] = useState(null);
  const [descOpen, setDescOpen] = useState(true);

  const abortRef = useRef({ aborted: false });
  useEffect(() => {
    abortRef.current.aborted = false;
    return () => {
      abortRef.current.aborted = true;
    };
  }, [slug]);

  useEffect(() => window.scrollTo(0, 0), [slug]);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug || slug === "undefined") {
        setProduct(null);
        setLoading(false);
        return;
      }

      // Prevent StrictMode dev double fetch for same slug
      if (__fetchedSlugs.has(slug)) return;
      __fetchedSlugs.add(slug);

      try {
        setLoading(true);

        const res = await getProductBySlug(slug);
        const p = res?.data ?? res;

        if (!abortRef.current.aborted) {
          setProduct(p || null);
          setSelectedSize((prev) => prev ?? (p?.sizes?.[0]?.id ?? "S"));
        }
      } catch (e) {
        console.error("Failed to load product:", e);
        if (!abortRef.current.aborted) setProduct(null);
      } finally {
        if (!abortRef.current.aborted) setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  // ✅ Images normalization (uses product.images array OR product.imageUrl/image_url etc)
  const images = useMemo(() => {
    const imgs = product?.images;
    const list = Array.isArray(imgs) ? imgs : [];

    const normalizedFromArray = list
      .map((img) =>
        typeof img === "string" ? resolveImageUrl(img) : resolveImageUrl(img?.url || img?.imageUrl || img?.image_url)
      )
      .filter(Boolean);

    // fallback to "best available" single image field
    if (normalizedFromArray.length === 0) {
      const one = pickProductImage(product);
      const resolved = resolveImageUrl(one);
      return resolved ? [resolved] : [];
    }

    return normalizedFromArray;
  }, [product]);

  const thumbImages = useMemo(
    () => Array.from(new Set(images)).slice(0, 6),
    [images]
  );

  useEffect(() => {
    if (images.length > 0) setMainImg(images[0]);
    else setMainImg(null);
  }, [images, slug]);

  const sizeOptions = useMemo(() => {
    const s = product?.sizes;
    if (Array.isArray(s) && s.length) {
      return s.map((x) => ({
        id: x.id ?? x.size ?? x.label,
        label:
          x.label ??
          (x.delta
            ? `${x.size ?? x.id ?? x.label} (+$${Number(x.delta)})`
            : String(x.size || x.id || x.label)),
        delta: Number(x.delta || 0),
      }));
    }
    return FALLBACK_SIZES;
  }, [product]);

  const basePrice = Number(product?.price || 0);
  const selectedDelta =
    sizeOptions.find((x) => x.id === selectedSize)?.delta ?? 0;
  const displayPrice = basePrice + selectedDelta;

  const oldPriceRaw =
    Number(product?.old_price) ||
    Number(product?.original_price) ||
    Number(product?.compare_at_price) ||
    0;

  const hasDiscount = oldPriceRaw > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((oldPriceRaw - displayPrice) / oldPriceRaw) * 100)
    : 0;

  useEffect(() => {
    async function fetchRecommended() {
      if (!product) return;
      try {
        setRecommendedLoading(true);
        const res = await getProducts({});
        const list = Array.isArray(res) ? res : res?.data ?? [];
        const filtered = list.filter((p) => p.slug !== product.slug);

        const mapped = filtered.map((p) => {
          const img = resolveImageUrl(pickProductImage(p));
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: Number(p.salePrice ?? p.price ?? 0),
            image: img,
          };
        });

        setRecommended(shuffle(mapped).slice(0, isMobile ? 4 : 8));
      } catch (e) {
        console.error("Failed to load recommended:", e);
        setRecommended([]);
      } finally {
        setRecommendedLoading(false);
      }
    }

    fetchRecommended();
  }, [product, isMobile]);

  const onAddRecommended = async (p) => {
    if (!p?.id) {
      alert("This item can't be added (missing product id).");
      return;
    }
    if (!isAuthenticated) {
      alert("Please login first");
      nav("/login");
      return;
    }
    try {
      await addToCart(p.id, 1);
      await getCart();
      alert("Added to cart ✓");
      window.navigator.vibrate?.(10);
    } catch (err) {
      console.error("Recommended add failed:", err);
      alert(err?.message || "Failed to add to cart");
    }
  };

  const onAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    if (!isAuthenticated) {
      alert("Please login first");
      nav("/login");
      return;
    }
    try {
      await addToCart(product.id, qty);
      alert("Added to cart ✓");
      window.navigator.vibrate?.(10);
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert(err?.message || "Failed to add to cart");
    }
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

  if (loading) {
    return (
      <main style={{ padding: "120px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2>Loading…</h2>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ padding: "120px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2>Product not found</h2>
          <p>Item doesn’t exist / was removed / or URL is invalid.</p>
          <button
            onClick={() => nav(-1)}
            style={{
              marginTop: 16,
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

  const recCols = bp.xs ? 1 : bp.sm ? 2 : bp.md ? 3 : 4;

  return (
    <main style={{ background: "#f6f4f8" }}>
      <section
        style={{
          padding: isMobile ? "90px 12px 30px" : "110px 20px 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            gap: isMobile ? 16 : 22,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                background: "#c9c5c0",
                borderRadius: 28,
                padding: 18,
                position: "relative",
                boxShadow: "0 14px 34px rgba(0,0,0,.10)",
              }}
            >
              {hasDiscount && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    background: "#ff5b5b",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 12,
                    padding: "8px 12px",
                    borderRadius: 999,
                    boxShadow: "0 10px 20px rgba(255,91,91,.25)",
                  }}
                >
                  Save {discountPercent}%
                </div>
              )}

              <button
                onClick={shareLink}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "rgba(255,255,255,.95)",
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                Share ⤴
              </button>

              <div
                style={{
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
                }}
              >
                {mainImg ? (
                  <img
                    src={mainImg}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: isMobile ? 380 : 500,
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: isMobile ? 380 : 500,
                      display: "grid",
                      placeItems: "center",
                      color: "#6b5a7a",
                      fontWeight: 900,
                    }}
                  >
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {thumbImages.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "#ece8ef",
                    borderRadius: 18,
                    padding: "10px 12px",
                    display: "flex",
                    gap: 12,
                    boxShadow: "0 10px 22px rgba(0,0,0,.08)",
                    overflowX: "auto",
                    maxWidth: "100%",
                  }}
                >
                  {thumbImages.map((g) => {
                    const active = mainImg === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setMainImg(g)}
                        style={{
                          border: active
                            ? `2px solid ${colors.vividPurple}`
                            : "1px solid rgba(0,0,0,.10)",
                          borderRadius: 14,
                          padding: 0,
                          background: "#fff",
                          cursor: "pointer",
                          width: 74,
                          height: 74,
                          overflow: "hidden",
                          boxShadow: active
                            ? "0 10px 18px rgba(102,51,153,.18)"
                            : "0 8px 16px rgba(0,0,0,.06)",
                          flex: "0 0 auto",
                        }}
                        title="View"
                      >
                        <img
                          src={g}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT (your UI stays as you had it) */}
          <div>
            {/* --- your existing RIGHT side content below remains unchanged --- */}
            {/* (Everything below is exactly your provided content) */}
            <div
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1px solid rgba(0,0,0,.06)",
                padding: 18,
                boxShadow: "0 14px 34px rgba(0,0,0,.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#6b5a7a",
                    fontSize: 13,
                  }}
                >
                  <span style={{ letterSpacing: 1 }}>★★★★★</span>
                  <span style={{ opacity: 0.9 }}>4.7 • 32 reviews</span>
                </div>

                <span
                  style={{
                    background: "#e9f7ee",
                    color: "#1f7a3a",
                    fontWeight: 800,
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #cdeed7",
                    height: "fit-content",
                  }}
                >
                  In stock
                </span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: colors.royalPlum,
                  }}
                >
                  ${displayPrice.toFixed(2)}
                </div>
                {hasDiscount && (
                  <div
                    style={{
                      color: "#9b90a7",
                      textDecoration: "line-through",
                      fontWeight: 700,
                    }}
                  >
                    ${oldPriceRaw.toFixed(2)}
                  </div>
                )}
              </div>

              {product.description && (
                <div
                  style={{
                    marginTop: 6,
                    color: "#5f516c",
                    fontSize: 13,
                  }}
                >
                  {product.description}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 13,
                      color: "#3a2f44",
                    }}
                  >
                    Size
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#f6ecf1",
                      color: "#9a3556",
                      border: "1px solid rgba(154,53,86,.18)",
                      fontWeight: 900,
                    }}
                  >
                    Required
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {sizeOptions.map((s) => {
                    const active = selectedSize === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSize(s.id)}
                        style={{
                          border: active
                            ? `2px solid ${colors.vividPurple}`
                            : "1px solid rgba(0,0,0,.12)",
                          background: "#fff",
                          borderRadius: 999,
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontWeight: 900,
                          fontSize: 13,
                          boxShadow: active
                            ? "0 10px 18px rgba(102,51,153,.14)"
                            : "none",
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "120px 1fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid rgba(0,0,0,.12)",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#fff",
                    height: 46,
                  }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={qtyBtn2}
                  >
                    −
                  </button>
                  <div
                    style={{
                      width: 48,
                      textAlign: "center",
                      fontWeight: 900,
                    }}
                  >
                    {qty}
                  </div>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    style={qtyBtn2}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={onAddToCart}
                  style={{
                    height: 46,
                    borderRadius: 16,
                    border: "none",
                    cursor: "pointer",
                    background: colors.royalPlum,
                    color: "#fff",
                    fontWeight: 900,
                    boxShadow: "0 14px 30px rgba(93,44,121,.22)",
                  }}
                >
                  Add to cart
                </button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {["3-5 day shipping", "7-day returns", "Secure checkout"].map(
                  (t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 12,
                        color: "#6b5a7a",
                        border: "1px solid rgba(0,0,0,.10)",
                        background: "#fff",
                        padding: "8px 10px",
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,.12)",
                          display: "inline-grid",
                          placeItems: "center",
                          fontSize: 12,
                        }}
                      >
                        ✓
                      </span>
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                background: "#fff",
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,.06)",
                boxShadow: "0 12px 28px rgba(0,0,0,.06)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setDescOpen((v) => !v)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 900,
                }}
              >
                <span>Description</span>
                <span style={{ fontSize: 18, opacity: 0.75 }}>
                  {descOpen ? "−" : "+"}
                </span>
              </button>

              {descOpen && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    color: "#5f516c",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {product.long_description ||
                    product.description ||
                    "This item is hand-crafted in small batches with premium materials and a protective top coat."}
                </div>
              )}
            </div>
          </div>
        </div>

        {!recommendedLoading && recommended.length > 0 && (
          <div style={{ maxWidth: 1200, margin: "26px auto 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>Recommended from Shop</h3>
              <Link
                to="/shop"
                style={{
                  color: colors.vividPurple,
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                View all →
              </Link>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gap: isMobile ? 14 : 18,
                gridTemplateColumns: `repeat(${recCols}, 1fr)`,
              }}
            >
              {recommended.map((p) => (
                <BestSellerCard
                  key={p.id}
                  id={p.id}
                  image={p.image}
                  name={p.name}
                  price={p.price}
                  slug={p.slug}
                  onAdd={onAddRecommended}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

const qtyBtn2 = {
  width: 40,
  height: 46,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 20,
  fontWeight: 900,
};