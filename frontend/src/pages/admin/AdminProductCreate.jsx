// frontend/src/pages/admin/AdminProductCreate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProductCreate() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    stockQuantity: "",
    isActive: true,
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function updateField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(file) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result || "");
    reader.readAsDataURL(file);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const name = values.name.trim();
    if (!name) { setError("Name is required."); return; }
    const price = parseFloat(values.price);
    if (isNaN(price) || price < 0) { setError("Price must be 0 or greater."); return; }

    const body = {
      name,
      slug: toSlug(name),
      description: values.description.trim() || undefined,
      price,
      salePrice: values.salePrice !== "" ? parseFloat(values.salePrice) : undefined,
      stockQuantity: values.stockQuantity !== "" ? parseInt(values.stockQuantity, 10) : undefined,
      isActive: values.isActive,
      categoryIds: values.categoryId ? [values.categoryId] : [],
      metadata: values.description.trim() ? { short: values.description.trim() } : undefined,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Create failed");
      }
      const created = await res.json();

      if (imageFile && created.id) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await fetch(`${API_BASE}/admin/products/${created.id}/images`, {
          method: "POST",
          headers: authHeaders(),
          body: fd,
        });
      }

      nav("/admin/products");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const cardStyle = {
    borderRadius: 16,
    padding: isMobile ? 10 : 14,
    background: "#faf6ff",
    border: "1px solid rgba(148,122,173,0.4)",
    display: "grid",
    gap: 10,
    boxSizing: "border-box",
  };

  const inputBase = {
    marginTop: 3,
    width: "100%",
    padding: isMobile ? "7px 9px" : "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,122,173,0.5)",
    fontSize: isMobile ? 12.5 : 13,
    boxSizing: "border-box",
    background: "#fff",
  };

  const labelText = { fontSize: isMobile ? 11.5 : 12, color: "#4f3d5c", display: "block" };

  return (
    <main style={{ padding: isMobile ? "80px 10px 16px" : "90px 20px 26px", background: "#f5f0fb", minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 10, justifyContent: "space-between", marginBottom: isMobile ? 10 : 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Add new product</h1>
            <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>Create a new resin piece for your catalog.</p>
          </div>
          <button
            type="button"
            onClick={() => nav("/admin/products")}
            style={{ borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", padding: isMobile ? "6px 10px" : "8px 14px", background: "#fff", fontSize: isMobile ? 11 : 12, cursor: "pointer", color: "#4a2a73", whiteSpace: "nowrap" }}
          >
            ← Back to products
          </button>
        </header>

        <form onSubmit={onSubmit} style={cardStyle}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", alignItems: "flex-start" }}>
            {/* Left: info */}
            <div style={{ display: "grid", gap: 8 }}>
              <label style={labelText}>
                Name *
                <input type="text" value={values.name} onChange={(e) => updateField("name", e.target.value)} style={{ ...inputBase, border: "1px solid rgba(148,122,173,0.6)" }} />
              </label>

              <label style={labelText}>
                Category
                <select value={values.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} style={inputBase}>
                  <option value="">— No category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label style={labelText}>
                Description / short text
                <textarea
                  value={values.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  style={{ ...inputBase, resize: "vertical", minHeight: 80 }}
                  placeholder="One or two lines about this piece…"
                />
              </label>

              <label style={{ ...labelText, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={values.isActive} onChange={(e) => updateField("isActive", e.target.checked)} />
                Active (visible in shop)
              </label>
            </div>

            {/* Right: pricing + image */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={labelText}>
                  Price *
                  <input type="number" step="0.01" min="0" value={values.price} onChange={(e) => updateField("price", e.target.value)} style={{ ...inputBase, border: "1px solid rgba(148,122,173,0.6)", appearance: "textfield" }} />
                </label>
                <label style={labelText}>
                  Sale price
                  <input type="number" step="0.01" min="0" value={values.salePrice} onChange={(e) => updateField("salePrice", e.target.value)} style={{ ...inputBase, appearance: "textfield" }} placeholder="Optional" />
                </label>
              </div>

              <label style={labelText}>
                Stock quantity
                <input type="number" min="0" step="1" value={values.stockQuantity} onChange={(e) => updateField("stockQuantity", e.target.value)} style={{ ...inputBase, appearance: "textfield" }} placeholder="Optional" />
              </label>

              <label style={labelText}>
                Product image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  style={{ marginTop: 3, width: "100%", fontSize: isMobile ? 11 : 12 }}
                />
                <span style={{ display: "block", marginTop: 2, fontSize: isMobile ? 10 : 11, color: "#7a6989" }}>
                  Uploaded to server (max 5 MB).
                </span>
              </label>

              {imagePreview && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#7a6989" }}>Thumbnail preview</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 4, fontSize: isMobile ? 11.5 : 12, color: "#b00020" }}>{error}</div>
          )}

          <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row", justifyContent: "flex-end", alignItems: isMobile ? "stretch" : "center", gap: 8, marginTop: 6 }}>
            <button type="button" onClick={() => nav("/admin/products")} style={{ padding: isMobile ? "7px 10px" : "7px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", background: "#fff", fontSize: isMobile ? 11.5 : 12, cursor: "pointer", color: "#4a2a73", width: isMobile ? "100%" : "auto" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: isMobile ? "9px 12px" : "7px 14px", borderRadius: 999, border: "none", background: saving ? "#9a7ab0" : "linear-gradient(90deg, #7c51a1, #4a2a73)", fontSize: 12, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontWeight: 600, width: isMobile ? "100%" : "auto" }}>
              {saving ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
