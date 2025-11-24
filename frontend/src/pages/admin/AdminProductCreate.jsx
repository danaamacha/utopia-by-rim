// frontend/src/pages/admin/AdminProductCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  readAdminState,
  writeAdminState,
  toNumber,
} from "./adminProductsUtils";
import useBreakpoint from "../../hooks/useBreakpoint";

export default function AdminProductCreate() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [values, setValues] = useState(() => ({
    id: "custom_" + Date.now().toString(36),
    name: "",
    cat: "",
    price: "",
    salePrice: "",
    image: "",
    short: "",
  }));
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result || "";
      updateField("image", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    const name = values.name.trim();
    const cat = values.cat.trim();
    const price = toNumber(values.price);
    const saleRaw = values.salePrice.trim();
    const hasSale = saleRaw !== "";
    const salePrice = hasSale ? toNumber(saleRaw) : null;

    if (!name) {
      setError("Name is required.");
      return;
    }
    if (price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    const payload = {
      name,
      cat,
      price,
      salePrice: hasSale ? salePrice : undefined,
      image: values.image.trim(),
      short: values.short.trim(),
    };

    const state = readAdminState();
    state[values.id] = {
      ...(state[values.id] || {}),
      ...payload,
      isNew: true,
      deleted: false,
      soldOut: false,
    };
    writeAdminState(state);

    nav("/admin/products");
  };

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
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 8 : 10,
            justifyContent: "space-between",
            marginBottom: isMobile ? 10 : 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 18 : 20,
                color: "#3c274f",
                wordBreak: "break-word",
              }}
            >
              Add new product
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: isMobile ? 11.5 : 13,
                color: "#7a6989",
              }}
            >
              Create a new resin piece for your catalog.
            </p>
            <p
              style={{
                marginTop: 2,
                fontSize: isMobile ? 10 : 11,
                color: "#7a6989",
                wordBreak: "break-all",
              }}
            >
              ID: <code>{values.id}</code>
            </p>
          </div>

          <button
            type="button"
            onClick={() => nav("/admin/products")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              padding: isMobile ? "6px 10px" : "8px 14px",
              background: "#fff",
              fontSize: isMobile ? 11 : 12,
              cursor: "pointer",
              color: "#4a2a73",
              whiteSpace: "nowrap",
            }}
          >
            ← Back to products
          </button>
        </header>

        <form onSubmit={onSubmit} style={cardStyle}>
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
              alignItems: "flex-start",
              minWidth: 0,
            }}
          >
            {/* Left column: basic info */}
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <label style={labelText}>
                Name *
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  style={{
                    ...inputBase,
                    border: "1px solid rgba(148,122,173,0.6)",
                  }}
                />
              </label>

              <label style={labelText}>
                Category
                <input
                  type="text"
                  value={values.cat}
                  onChange={(e) => updateField("cat", e.target.value)}
                  style={{
                    ...inputBase,
                    border: "1px solid rgba(148,122,173,0.4)",
                  }}
                  placeholder="e.g. Clocks, Tables, Coasters"
                />
              </label>

              <label style={labelText}>
                Short description
                <textarea
                  value={values.short}
                  onChange={(e) => updateField("short", e.target.value)}
                  rows={isMobile ? 3 : 3}
                  style={{
                    ...inputBase,
                    border: "1px solid rgba(148,122,173,0.4)",
                    resize: "vertical",
                    minHeight: isMobile ? 70 : 80,
                  }}
                  placeholder="One or two lines about this piece…"
                />
              </label>
            </div>

            {/* Right column: pricing + image */}
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <label style={labelText}>
                  Price (USD) *
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    style={{
                      ...inputBase,
                      border: "1px solid rgba(148,122,173,0.6)",
                      appearance: "textfield",
                    }}
                  />
                </label>

                <label style={labelText}>
                  Sale price
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values.salePrice}
                    onChange={(e) =>
                      updateField("salePrice", e.target.value)
                    }
                    style={{
                      ...inputBase,
                      border: "1px solid rgba(148,122,173,0.4)",
                      appearance: "textfield",
                    }}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label style={labelText}>
                Image URL (optional)
                <input
                  type="text"
                  value={values.image}
                  onChange={(e) => updateField("image", e.target.value)}
                  style={{
                    ...inputBase,
                    border: "1px solid rgba(148,122,173,0.4)",
                  }}
                  placeholder="/best/best1.jpg or https://…"
                />
              </label>

              <label style={labelText}>
                Or upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageFileChange(e.target.files?.[0] || null)
                  }
                  style={{
                    marginTop: 3,
                    width: "100%",
                    fontSize: isMobile ? 11 : 12,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: isMobile ? 10 : 11,
                    color: "#7a6989",
                  }}
                >
                  Image will be stored locally in your browser (demo).
                </span>
              </label>

              {values.image && (
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 54 : 60,
                      height: isMobile ? 54 : 60,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#eee",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={values.image}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: isMobile ? 10.5 : 11,
                      color: "#7a6989",
                    }}
                  >
                    Thumbnail preview
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 4,
                fontSize: isMobile ? 11.5 : 12,
                color: "#b00020",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column-reverse" : "row",
              justifyContent: "flex-end",
              alignItems: isMobile ? "stretch" : "center",
              gap: 8,
              marginTop: 6,
            }}
          >
            <button
              type="button"
              onClick={() => nav("/admin/products")}
              style={{
                padding: isMobile ? "7px 10px" : "7px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                background: "#fff",
                fontSize: isMobile ? 11.5 : 12,
                cursor: "pointer",
                color: "#4a2a73",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: isMobile ? "9px 12px" : "7px 14px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
                fontSize: isMobile ? 12 : 12,
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
                width: isMobile ? "100%" : "auto",
              }}
            >
              Save product
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
