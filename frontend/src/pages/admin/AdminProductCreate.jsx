// frontend/src/pages/admin/AdminProductCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import {
  adminCreateProduct,
  adminUploadProductImage,
  toNumber,
} from "./adminProductsUtils";

export default function AdminProductCreate() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [values, setValues] = useState({
    name: "",
    category: "",
    price: "",
    salePrice: "",
    shortDescription: "",
    stock: "",
  });

  const updateField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // =========================
  // SUBMIT
  // =========================
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = values.name.trim();
    const category = values.category.trim();
    const price = toNumber(values.price);

    const saleRaw = String(values.salePrice || "").trim();
    const hasSale = saleRaw !== "";
    const salePrice = hasSale ? toNumber(saleRaw) : null;

    const stockRaw = String(values.stock || "").trim();
    const stock = stockRaw === "" ? 0 : Math.max(0, Math.floor(toNumber(stockRaw)));

    if (!name) return setError("Name is required.");
    if (price <= 0) return setError("Price must be greater than 0.");
    if (hasSale && salePrice >= price)
      return setError("Sale price must be less than normal price.");

    // ⚠️ IMPORTANT:
    // Send category string (backend will resolve to categoryIds)
    const dto = {
      name,
      category, // backend resolves this
      price,
      salePrice: hasSale ? salePrice : null,
      stockQuantity: stock,
    };

    try {
      setSaving(true);

      // 1️⃣ Create product
     const created = await adminCreateProduct(dto);
const productId = created?.id || created?.data?.id || created?.product?.id;

      if (!productId)
        throw new Error("Product created but no ID returned.");

      // 2️⃣ Upload images
      if (selectedFiles?.length) {
        for (let i = 0; i < selectedFiles.length; i++) {
          await adminUploadProductImage(productId, selectedFiles[i], {
            isPrimary: i === 0,  // ✅ FIRST image = main
            position: i,
          });
        }
      }

      // 3️⃣ Redirect to edit page
      nav(`/admin/products/${productId}/edit`);

    } catch (e) {
      setError(e?.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // STYLES
  // =========================

  const cardStyle = {
    borderRadius: 16,
    padding: isMobile ? 10 : 14,
    background: "#faf6ff",
    border: "1px solid rgba(148,122,173,0.4)",
    display: "grid",
    gap: 10,
  };

  const inputBase = {
    marginTop: 3,
    width: "100%",
    padding: isMobile ? "7px 9px" : "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,122,173,0.5)",
    fontSize: isMobile ? 12.5 : 13,
    outline: "none",
  };

  const labelText = {
    fontSize: isMobile ? 11.5 : 12,
    color: "#4f3d5c",
    display: "block",
  };

  return (
    <main
      style={{
        padding: isMobile ? "80px 10px 16px" : "90px 20px 26px",
        background: "#f5f0fb",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: "#3c274f" }}>Add product</h1>

        {error && (
          <div style={{
            background: "rgba(244,67,54,0.08)",
            border: "1px solid rgba(244,67,54,0.25)",
            color: "#b71c1c",
            padding: "10px 12px",
            borderRadius: 12,
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={cardStyle}>

            <label style={labelText}>
              Name *
              <input
                type="text"
                value={values.name}
                onChange={(e) => updateField("name", e.target.value)}
                style={inputBase}
              />
            </label>

            <label style={labelText}>
              Category
              <input
                type="text"
                value={values.category}
                onChange={(e) => updateField("category", e.target.value)}
                style={inputBase}
                placeholder="Example: Clocks"
              />
            </label>

            <label style={labelText}>
              Price *
              <input
                type="number"
                value={values.price}
                onChange={(e) => updateField("price", e.target.value)}
                style={inputBase}
              />
            </label>

            <label style={labelText}>
              Upload images (multiple)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setSelectedFiles(Array.from(e.target.files || []))
                }
                style={inputBase}
              />
            </label>

            {selectedFiles.length > 0 && (
              <div style={{
                width: 360,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(148,122,173,0.25)",
              }}>
                <img
                  src={URL.createObjectURL(selectedFiles[0])}
                  alt="preview"
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: isMobile ? "9px 12px" : "10px 14px",
              borderRadius: 999,
              border: "none",
              background: saving
                ? "rgba(124,81,161,0.55)"
                : "linear-gradient(90deg, #7c51a1, #4a2a73)",
              color: "#fff",
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              width: 240,
            }}
          >
            {saving ? "Saving…" : "Create product"}
          </button>
        </form>
      </div>
    </main>
  );
}