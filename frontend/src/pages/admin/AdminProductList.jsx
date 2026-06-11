// frontend/src/pages/admin/AdminProductList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function primaryImage(product) {
  if (!product.images || product.images.length === 0) return null;
  const primary = product.images.find((i) => i.isPrimary);
  return (primary || product.images[0])?.url || null;
}

export default function AdminProductList() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (e) {
      setError(e.message || "Error loading products");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      (p.categories || []).forEach((c) => {
        if (!map.has(c.id)) map.set(c.id, c.name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchText =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);

      const matchCat =
        category === "all" ||
        (p.categories || []).some((c) => c.id === category);

      let matchStatus = true;
      if (status === "active") matchStatus = p.isActive;
      if (status === "inactive") matchStatus = !p.isActive;
      if (status === "soldout") matchStatus = p.stockQuantity === 0;

      return matchText && matchCat && matchStatus;
    });
  }, [products, search, category, status]);

  async function handleToggleActive(product) {
    const updated = products.map((p) =>
      p.id === product.id ? { ...p, isActive: !p.isActive } : p
    );
    setProducts(updated);
    try {
      const res = await fetch(`${API_BASE}/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setProducts(products);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      const res = await fetch(`${API_BASE}/admin/products/${product.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      fetchProducts();
    }
  }

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
              Showing {filtered.length} of {products.length} products.
            </p>
          </div>
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
        </header>

        {/* FILTERS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: isMobile ? "1 1 100%" : "1 1 260px", minWidth: isMobile ? 0 : 200 }}>
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
          <div style={{ flex: isMobile ? "1 1 48%" : "0 0 190px", minWidth: isMobile ? 0 : 160 }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: isMobile ? "1 1 48%" : "0 0 180px", minWidth: isMobile ? 0 : 160 }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="soldout">Sold out (stock 0)</option>
            </select>
          </div>
        </div>

        {/* ERROR / LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#7a6989", fontSize: 14 }}>
            Loading products…
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(176,0,32,0.07)", color: "#b00020", fontSize: 13, marginBottom: 12 }}>
            {error} —{" "}
            <button onClick={fetchProducts} style={{ background: "none", border: "none", color: "#b00020", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>
              retry
            </button>
          </div>
        )}

        {/* TABLE */}
        {!loading && (
          <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", overflow: "hidden", background: "#fff" }}>
            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: isMobile ? 12 : 13 }}>
                <thead style={{ background: "#f5effb" }}>
                  <tr>
                    <Th>Product</Th>
                    {!isMobile && <Th>Category</Th>}
                    <Th align="right">Price</Th>
                    {!isMobile && <Th align="right">Stock</Th>}
                    <Th>Status</Th>
                    {!isMobile && <Th align="right">Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <Td colSpan={6} align="center">No products match your current filters.</Td>
                    </tr>
                  )}
                  {filtered.map((p) => {
                    const hasSale = p.salePrice != null;
                    const img = primaryImage(p);
                    const statusKey = !p.isActive ? "inactive" : p.stockQuantity === 0 ? "soldout" : "active";

                    return (
                      <tr key={p.id}>
                        <Td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: isMobile ? 42 : 46, height: isMobile ? 42 : 46, borderRadius: 12, overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                              {img && <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "#3c274f", marginBottom: 2, fontSize: isMobile ? 12.5 : 13 }}>
                                {p.name}
                              </div>
                              {p.description && (
                                <div style={{ fontSize: isMobile ? 10.5 : 11, color: "#7a6989", maxWidth: isMobile ? 180 : 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p.description}
                                </div>
                              )}
                              {isMobile && (
                                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  <ActionBtn onClick={() => nav(`/admin/products/${p.id}/edit`)}>Edit</ActionBtn>
                                  <ActionBtn soft onClick={() => handleToggleActive(p)}>
                                    {p.isActive ? "Deactivate" : "Activate"}
                                  </ActionBtn>
                                  <ActionBtn danger onClick={() => handleDelete(p)}>Delete</ActionBtn>
                                </div>
                              )}
                            </div>
                          </div>
                        </Td>

                        {!isMobile && (
                          <Td>{(p.categories || []).map((c) => c.name).join(", ") || "—"}</Td>
                        )}

                        <Td align="right">
                          {hasSale ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <span style={{ fontWeight: 700, color: "#4a2a73" }}>${Number(p.salePrice).toFixed(2)}</span>
                              <span style={{ fontSize: 11, color: "#a38fb5", textDecoration: "line-through" }}>${Number(p.price).toFixed(2)}</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 700, color: "#4a2a73" }}>${Number(p.price).toFixed(2)}</span>
                          )}
                        </Td>

                        {!isMobile && (
                          <Td align="right">
                            <span style={{ fontWeight: 600, color: p.stockQuantity === 0 ? "#b71c1c" : "#1b5e20" }}>
                              {p.stockQuantity ?? "—"}
                            </span>
                          </Td>
                        )}

                        <StatusTd status={statusKey} />

                        {!isMobile && (
                          <Td align="right">
                            <ActionBtn onClick={() => nav(`/admin/products/${p.id}/edit`)}>Edit</ActionBtn>{" "}
                            <ActionBtn soft onClick={() => handleToggleActive(p)}>
                              {p.isActive ? "Deactivate" : "Activate"}
                            </ActionBtn>{" "}
                            <ActionBtn danger onClick={() => handleDelete(p)}>Delete</ActionBtn>
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th style={{ textAlign: align, padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#4a2a73", borderBottom: "1px solid rgba(148,122,173,0.25)", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function Td({ children, align = "left", colSpan }) {
  return (
    <td colSpan={colSpan} style={{ textAlign: align, padding: "8px 10px", fontSize: 12, color: "#4f3d5c", borderBottom: "1px solid rgba(148,122,173,0.13)", verticalAlign: "top" }}>
      {children}
    </td>
  );
}

function StatusTd({ status }) {
  const map = {
    active: { bg: "rgba(76,175,80,0.12)", color: "#1b5e20", label: "Active" },
    inactive: { bg: "rgba(158,158,158,0.12)", color: "#424242", label: "Inactive" },
    soldout: { bg: "rgba(244,67,54,0.12)", color: "#b71c1c", label: "Sold out" },
  };
  const s = map[status] || map.inactive;
  return (
    <Td>
      <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    </Td>
  );
}

function ActionBtn({ children, onClick, soft, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 999,
        border: soft || danger ? "none" : "1px solid rgba(148,122,173,0.6)",
        background: danger ? "rgba(244,67,54,0.08)" : soft ? "rgba(124,81,161,0.09)" : "#fff",
        color: danger ? "#b71c1c" : "#4a2a73",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
