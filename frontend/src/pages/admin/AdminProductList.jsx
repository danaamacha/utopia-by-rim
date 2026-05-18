// frontend/src/pages/admin/AdminProductList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import {
  adminDeleteProduct,
  adminGetProducts,
  resolveAdminImageUrl,
} from "./adminProductsUtils";

// ✅ Pick main image from backend images[] (primary first)
function pickMainImageFromImages(p) {
  const imgs = Array.isArray(p?.images) ? p.images : [];
  const primary = imgs.find((i) => i?.isPrimary && i?.url);
  return primary?.url || imgs[0]?.url || "";
}

// ✅ Get category name from backend categories[]
function pickCategoryName(p) {
  const cats = Array.isArray(p?.categories) ? p.categories : [];
  // prefer name, fallback to slug
  return cats[0]?.name || cats[0]?.slug || "";
}

export default function AdminProductList() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all"); // all | instock | soldout

  const [imgFail, setImgFail] = useState({});

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const list = await adminGetProducts();

      const normalized = (list || []).map((p) => {
        const rawImg = pickMainImageFromImages(p); // ✅ correct source
        const catName = pickCategoryName(p);       // ✅ correct source

        return {
          id: p.id,
          name: p.name ?? "",
          cat: catName,
          price: p.price ?? 0,
          salePrice: p.salePrice ?? null,
          image: rawImg,
          short: p.shortDescription ?? p.short ?? p.description ?? "",
          soldOut: !!(p.soldOut ?? false),
          stock: p.stock ?? p.stockQuantity ?? null,
        };
      });

      setProducts(normalized);
      setImgFail({});
    } catch (e) {
      setErr(e?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.cat && set.add(p.cat));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const matchText =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.short || "").toLowerCase().includes(q);

      const matchCat = category === "all" || p.cat === category;

      let matchStatus = true;
      if (status === "instock") matchStatus = !p.soldOut;
      if (status === "soldout") matchStatus = !!p.soldOut;

      return matchText && matchCat && matchStatus;
    });
  }, [products, search, category, status]);

  const handleDelete = async (id, name) => {
    const ok = window.confirm(`Delete “${name}”?\nThis will remove it from the database.`);
    if (!ok) return;

    try {
      await adminDeleteProduct(id);
      await load();
    } catch (e) {
      alert(e?.message || "Failed to delete product.");
    }
  };

  const totalCount = products.length;

  return (
    <main
      style={{
        padding: isMobile ? "80px 10px 16px" : "90px 20px 26px",
        background: "#f5f0fb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: isMobile ? 8 : 10,
            justifyContent: "space-between",
            marginBottom: isMobile ? 10 : 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>
              Products
            </h1>
            <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>
              Manage your resin pieces, categories, stock and sale status.
            </p>
            <p style={{ marginTop: 2, fontSize: isMobile ? 10 : 11, color: "#a38fb5" }}>
              Showing {filtered.length} of {totalCount} products.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={load}
              style={{
                padding: isMobile ? "7px 12px" : "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.45)",
                background: "#fff",
                fontSize: isMobile ? 11.5 : 12,
                cursor: "pointer",
                color: "#4a2a73",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              style={{
                padding: isMobile ? "7px 12px" : "8px 14px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
                fontSize: isMobile ? 11.5 : 12,
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
              onClick={() => nav("/admin/products/new")}
            >
              + Add product
            </button>
          </div>
        </header>

        {/* ERROR */}
        {err && (
          <div
            style={{
              background: "rgba(244,67,54,0.08)",
              border: "1px solid rgba(244,67,54,0.25)",
              color: "#b71c1c",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 12.5,
            }}
          >
            {err}
          </div>
        )}

        {/* FILTERS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: isMobile ? "1 1 100%" : "1 1 260px" }}>
            <input
              type="text"
              placeholder="Search by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: isMobile ? "1 1 48%" : "0 0 190px" }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 10px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: isMobile ? "1 1 48%" : "0 0 190px" }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 10px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All status</option>
              <option value="instock">In stock</option>
              <option value="soldout">Sold out</option>
            </select>
          </div>
        </div>

        {/* LIST */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(148,122,173,0.25)", background: "#fff", overflow: "hidden" }}>
          <div style={{ padding: isMobile ? 10 : 12, borderBottom: "1px solid rgba(148,122,173,0.18)", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12.5, color: "#4f3d5c", fontWeight: 700 }}>Product list</div>
            <div style={{ fontSize: 11.5, color: "#7a6989" }}>{loading ? "Loading…" : `${filtered.length} items`}</div>
          </div>

          {loading ? (
            <div style={{ padding: 12, fontSize: 13, color: "#7a6989" }}>Loading products…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: "#7a6989" }}>No products match your filters.</div>
          ) : (
            <div style={{ display: "grid" }}>
              {filtered.map((p) => {
                const imgSrc = resolveAdminImageUrl(p.image);

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "54px 1fr" : "60px 1fr auto",
                      gap: 10,
                      padding: isMobile ? 10 : 12,
                      borderTop: "1px solid rgba(148,122,173,0.12)",
                      alignItems: "center",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: isMobile ? 54 : 60,
                        height: isMobile ? 54 : 60,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "#f5effb",
                        border: "1px solid rgba(148,122,173,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#7a6989",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {!imgFail[p.id] && imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={() => setImgFail((prev) => ({ ...prev, [p.id]: true }))}
                        />
                      ) : (
                        "IMG"
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: "#3c274f",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </div>

                      <div style={{ marginTop: 3, fontSize: 12, color: "#7a6989", display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span>{p.cat || "—"}</span>
                        <span>•</span>
                        <span style={{ color: "#4a2a73", fontWeight: 800 }}>${Number(p.salePrice ?? p.price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, justifyContent: isMobile ? "flex-start" : "flex-end", gridColumn: isMobile ? "2 / span 1" : "auto" }}>
                      <button
                        type="button"
                        onClick={() => nav(`/admin/products/${p.id}/edit`)}
                        style={{
                          borderRadius: 999,
                          border: "1px solid rgba(148,122,173,0.45)",
                          padding: "7px 10px",
                          background: "#fff",
                          fontSize: 12,
                          cursor: "pointer",
                          color: "#4a2a73",
                          fontWeight: 700,
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        style={{
                          borderRadius: 999,
                          border: "1px solid rgba(244,67,54,0.35)",
                          padding: "7px 10px",
                          background: "rgba(244,67,54,0.06)",
                          fontSize: 12,
                          cursor: "pointer",
                          color: "#b71c1c",
                          fontWeight: 800,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}