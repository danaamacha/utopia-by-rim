// frontend/src/pages/admin/AdminProductEdit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function primaryImage(product) {
  if (!product?.images?.length) return "";
  const primary = product.images.find((i) => i.isPrimary);
  return (primary || product.images[0])?.url || "";
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [values, setValues] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/admin/products/${id}`, { headers: authHeaders() }),
      fetch(`${API_BASE}/categories`),
    ])
      .then(async ([pRes, cRes]) => {
        if (pRes.status === 404) { setNotFound(true); return; }
        if (!pRes.ok) throw new Error("Failed to load product");
        const product = await pRes.json();
        const cats = cRes.ok ? await cRes.json() : [];
        setCategories(Array.isArray(cats) ? cats : []);
        setValues({
          name: product.name || "",
          description: product.description || product.metadata?.short || "",
          price: product.price != null ? String(product.price) : "",
          salePrice: product.salePrice != null ? String(product.salePrice) : "",
          stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : "",
          isActive: product.isActive ?? true,
          categoryId: product.categories?.[0]?.id || "",
        });
        setImagePreview(primaryImage(product));
      })
      .catch((e) => setError(e.message || "Error loading product"))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(field, value) {
    setValues((prev) => (prev ? { ...prev, [field]: value } : prev));
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
    if (!values) return;
    setError("");

    const name = values.name.trim();
    if (!name) { setError("Name is required."); return; }
    const price = parseFloat(values.price);
    if (isNaN(price) || price < 0) { setError("Price must be 0 or greater."); return; }

    const body = {
      name,
      description: values.description.trim() || undefined,
      price,
      salePrice: values.salePrice !== "" ? parseFloat(values.salePrice) : null,
      stockQuantity: values.stockQuantity !== "" ? parseInt(values.stockQuantity, 10) : undefined,
      isActive: values.isActive,
      categoryIds: values.categoryId ? [values.categoryId] : [],
      metadata: values.description.trim() ? { short: values.description.trim() } : undefined,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Update failed");
      }

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await fetch(`${API_BASE}/admin/products/${id}/images`, {
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

  const mainStyle = { padding: isMobile ? "80px 10px 16px" : "90px 20px 26px", background: "#f5f0fb", minHeight: "100vh", boxSizing: "border-box" };

  if (loading) {
    return <main style={mainStyle}><div style={{ maxWidth: 900, margin: "0 auto", color: "#7a6989", fontSize: 14, paddingTop: 20 }}>Loading…</div></main>;
  }

  if (notFound) {
    return (
      <main style={mainStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ color: "#3c274f", fontSize: 20 }}>Product not found</h1>
          <p style={{ color: "#7a6989", fontSize: 13 }}>This product may have been deleted or the link is invalid.</p>
          <button onClick={() => nav("/admin/products")} style={{ marginTop: 12, borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", padding: "8px 14px", background: "#fff", fontSize: 12, cursor: "pointer", color: "#4a2a73" }}>
            ← Back to products
          </button>
        </div>
      </main>
    );
  }

  if (!values) return null;

  const cardStyle = { borderRadius: 16, padding: isMobile ? 10 : 14, background: "#faf6ff", border: "1px solid rgba(148,122,173,0.4)", display: "grid", gap: 10, boxSizing: "border-box" };
  const inputBase = { marginTop: 3, width: "100%", padding: isMobile ? "7px 9px" : "8px 10px", borderRadius: 10, border: "1px solid rgba(148,122,173,0.5)", fontSize: isMobile ? 12.5 : 13, boxSizing: "border-box", background: "#fff" };
  const labelText = { fontSize: isMobile ? 11.5 : 12, color: "#4f3d5c", display: "block" };

  return (
    <main style={mainStyle}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 10, justifyContent: "space-between", marginBottom: isMobile ? 10 : 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Edit product</h1>
            <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>Update details for this piece.</p>
            <p style={{ marginTop: 2, fontSize: isMobile ? 10 : 11, color: "#7a6989", wordBreak: "break-all" }}>
              ID: <code>{id}</code>
            </p>
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
                Replace image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  style={{ marginTop: 3, width: "100%", fontSize: isMobile ? 11 : 12 }}
                />
                <span style={{ display: "block", marginTop: 2, fontSize: isMobile ? 10 : 11, color: "#7a6989" }}>
                  Leave empty to keep current image.
                </span>
              </label>

              {imagePreview && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#7a6989" }}>{imageFile ? "New image preview" : "Current image"}</span>
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
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
