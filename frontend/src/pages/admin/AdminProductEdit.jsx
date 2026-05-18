// frontend/src/pages/admin/AdminProductEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import {
  resolveAdminImageUrl,
  adminGetProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadProductImage,
  adminDeleteProductImage,
  toNumber,
  pickProductImage,
  API_BASE,
} from "./adminProductsUtils";

export default function AdminProductEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [values, setValues] = useState(null);
  const [imgFail, setImgFail] = useState(false);
  const [thumbFail, setThumbFail] = useState({});

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const getToken = () => {
    const keys = ["accessToken", "token", "jwt", "auth_token", "access_token", "utopia_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && typeof v === "string" && v.length > 20) return v;
    }
    return "";
  };

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text || null;
      }

      if (!res.ok) throw new Error(data?.message || "Failed to load categories");

      const list = data?.data ?? data ?? [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("Categories load error:", e);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  const normalizeImages = (p) => {
    const raw =
      (Array.isArray(p?.images) && p.images) ||
      (Array.isArray(p?.productImages) && p.productImages) ||
      (Array.isArray(p?.product_images) && p.product_images) ||
      (Array.isArray(p?.gallery) && p.gallery) ||
      [];

    const mapped = raw
      .map((x, idx) => ({
        id: x?.id ?? `${idx}`,
        url: x?.url ?? x?.imageUrl ?? x?.image_url ?? x?.path ?? "",
        isPrimary: !!(x?.isPrimary ?? x?.is_primary ?? false),
        position: Number.isFinite(Number(x?.position)) ? Number(x.position) : idx,
      }))
      .filter((x) => !!x.url);

    if (mapped.length > 0 && !mapped.some((i) => i.isPrimary)) {
      mapped[0] = { ...mapped[0], isPrimary: true };
    }

    mapped.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return mapped;
  };

  const load = async () => {
    try {
      setError("");
      setLoading(true);

      const p = await adminGetProduct(id);

      const images = normalizeImages(p);
      const main = (p?.imageUrl ?? p?.image ?? pickProductImage(p) ?? "").trim();

      const categoryIds = Array.isArray(p?.categories)
        ? p.categories.map((c) => c.id).filter(Boolean)
        : [];

      setValues({
        id: p.id,
        name: p.name ?? "",
        categoryIds,
        price: p.price != null ? String(p.price) : "",
        salePrice: p.salePrice != null ? String(p.salePrice) : "",
        imageUrl: main,
        images,
        shortDescription: p.shortDescription ?? p.short ?? "",
        soldOut: !!(p.soldOut ?? false),
        stock: p.stockQuantity != null ? String(p.stockQuantity) : "",
      });

      setImgFail(false);
      setThumbFail({});
    } catch (e) {
      setError(e?.message || "Failed to load product.");
      setValues(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = (field, value) => {
    setValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (field === "imageUrl") setImgFail(false);
  };

  // ✅ Upload multiple images (works for NEW products too)
  const handleImagesFilesChange = async (files, inputEl) => {
    if (!files?.length) return;
    if (!values?.id) {
      setError("Missing product id. Refresh page and try again.");
      if (inputEl) inputEl.value = "";
      return;
    }

    try {
      setError("");
      setSaving(true);

      const createdImgs = [];

      for (let i = 0; i < files.length; i++) {
        const res = await adminUploadProductImage(values.id, files[i], {
          isPrimary: i === 0,
          position: i,
        });

        // res might be image object OR wrapper OR product
        const url =
          res?.url ||
          res?.data?.url ||
          res?.image?.url ||
          res?.data?.image?.url ||
          null;

        if (url) {
          createdImgs.push({
            id: res?.id || res?.data?.id || `${Date.now()}-${i}`,
            url,
            isPrimary: !!(res?.isPrimary ?? res?.data?.isPrimary ?? i === 0),
            position: Number.isFinite(Number(res?.position ?? res?.data?.position))
              ? Number(res?.position ?? res?.data?.position)
              : i,
          });
        }
      }

      // ✅ show immediately
      if (createdImgs.length) {
        setValues((prev) => {
          if (!prev) return prev;

          const merged = [...(prev.images || []), ...createdImgs]
            .filter((x) => !!x.url)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

          const primaryUrl = createdImgs.find((x) => x.isPrimary)?.url;

          return {
            ...prev,
            images: merged,
            imageUrl: primaryUrl || prev.imageUrl,
          };
        });

        setImgFail(false);
        setThumbFail({});
      }

      // ✅ then reload from backend
      await load();
    } catch (e) {
      setError(e?.message || "Images upload failed.");
    } finally {
      setSaving(false);
      if (inputEl) inputEl.value = ""; // ✅ critical
    }
  };

  const setAsPrimary = async (img) => {
    if (!img?.url || !values?.id) return;

    try {
      setError("");
      setSaving(true);

      await adminUpdateProduct(values.id, { imageUrl: img.url });

      setValues((prev) => {
        if (!prev) return prev;
        const nextImages = (prev.images || []).map((x) => ({
          ...x,
          isPrimary: x.id === img.id,
        }));
        return { ...prev, images: nextImages, imageUrl: img.url };
      });

      setImgFail(false);
    } catch (e) {
      setError(e?.message || "Failed to set main image.");
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async (img) => {
    if (!values?.id || !img?.id) return;

    const ok = window.confirm("Delete this image?");
    if (!ok) return;

    try {
      setError("");
      setSaving(true);
      await adminDeleteProductImage(values.id, img.id);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete image.");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!values) return;
    setError("");

    const name = values.name.trim();
    const price = toNumber(values.price);

    const saleRaw = String(values.salePrice || "").trim();
    const hasSale = saleRaw !== "";
    const salePrice = hasSale ? toNumber(saleRaw) : null;

    const imageUrl = String(values.imageUrl || "").trim();
    const shortDescription = String(values.shortDescription || "").trim();

    const soldOut = !!values.soldOut;
    const stockRaw = String(values.stock || "").trim();
    const stockQuantity = stockRaw === "" ? 0 : Math.max(0, Math.floor(toNumber(stockRaw)));

    if (!name) return setError("Name is required.");
    if (price <= 0) return setError("Price must be greater than 0.");
    if (hasSale && salePrice >= price) return setError("Sale price must be less than normal price.");

    const dto = {
      name,
      price,
      salePrice: hasSale ? salePrice : null,
      imageUrl,
      shortDescription,
      soldOut,
      stockQuantity,
      categoryIds: Array.isArray(values.categoryIds) ? values.categoryIds : [],
    };

    try {
      setSaving(true);
      await adminUpdateProduct(values.id, dto);
      nav("/admin/products");
    } catch (e2) {
      setError(e2?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!values) return;
    const ok = window.confirm(`Delete “${values.name}”? This removes it from DB.`);
    if (!ok) return;

    try {
      setSaving(true);
      await adminDeleteProduct(values.id);
      nav("/admin/products");
    } catch (e) {
      setError(e?.message || "Failed to delete product.");
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = useMemo(
    () => ({
      borderRadius: 16,
      padding: isMobile ? 10 : 14,
      background: "#faf6ff",
      border: "1px solid rgba(148,122,173,0.4)",
      display: "grid",
      gap: 10,
      boxSizing: "border-box",
    }),
    [isMobile]
  );

  const inputBase = useMemo(
    () => ({
      marginTop: 3,
      width: "100%",
      padding: isMobile ? "7px 9px" : "8px 10px",
      borderRadius: 10,
      border: "1px solid rgba(148,122,173,0.5)",
      fontSize: isMobile ? 12.5 : 13,
      boxSizing: "border-box",
      outline: "none",
    }),
    [isMobile]
  );

  const labelText = useMemo(
    () => ({
      fontSize: isMobile ? 11.5 : 12,
      color: "#4f3d5c",
      display: "block",
    }),
    [isMobile]
  );

  if (loading) {
    return (
      <main style={{ padding: isMobile ? "80px 10px" : "90px 20px", background: "#f5f0fb", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", color: "#7a6989" }}>Loading…</div>
      </main>
    );
  }

  if (!values) {
    return (
      <main style={{ padding: isMobile ? "80px 10px" : "90px 20px", background: "#f5f0fb", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ margin: 0, color: "#3c274f" }}>Product not found</h1>
          <p style={{ color: "#7a6989" }}>{error || "Invalid link or deleted product."}</p>
          <button
            type="button"
            onClick={() => nav("/admin/products")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              padding: "8px 14px",
              background: "#fff",
              cursor: "pointer",
              color: "#4a2a73",
              fontWeight: 800,
            }}
          >
            ← Back to products
          </button>
        </div>
      </main>
    );
  }

  const primaryThumb = values.imageUrl;

  return (
    <main style={{ padding: isMobile ? "80px 10px 16px" : "90px 20px 26px", background: "#f5f0fb", minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 10, justifyContent: "space-between", marginBottom: isMobile ? 10 : 14 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Edit product</h1>
            <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>Update details for this piece.</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                fontWeight: 700,
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(244,67,54,0.35)",
                padding: isMobile ? "6px 10px" : "8px 14px",
                background: "rgba(244,67,54,0.06)",
                fontSize: isMobile ? 11 : 12,
                cursor: saving ? "not-allowed" : "pointer",
                color: "#b71c1c",
                whiteSpace: "nowrap",
                fontWeight: 900,
              }}
            >
              Delete
            </button>
          </div>
        </header>

        {error && (
          <div style={{ background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.25)", color: "#b71c1c", padding: "10px 12px", borderRadius: 12, marginBottom: 12, fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <label style={labelText}>
              Name *
              <input type="text" value={values.name} onChange={(e) => updateField("name", e.target.value)} style={{ ...inputBase, border: "1px solid rgba(148,122,173,0.6)" }} />
            </label>

            <label style={labelText}>
              Categories (select one or more)
              <select
                multiple
                value={values.categoryIds}
                disabled={catLoading}
                onChange={(e) => updateField("categoryIds", Array.from(e.target.selectedOptions).map((o) => o.value))}
                style={{ ...inputBase, height: isMobile ? 110 : 130, borderRadius: 12, background: "#fff" }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "#7a6989", marginTop: 4 }}>Tip: Hold Ctrl (Windows) / Cmd (Mac) to select multiple.</div>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <label style={labelText}>
                Price *
                <input type="number" inputMode="decimal" value={values.price} onChange={(e) => updateField("price", e.target.value)} style={inputBase} />
              </label>

              <label style={labelText}>
                Sale Price (optional)
                <input type="number" inputMode="decimal" value={values.salePrice} onChange={(e) => updateField("salePrice", e.target.value)} style={inputBase} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <label style={labelText}>
                Stock Quantity
                <input type="number" value={values.stock} onChange={(e) => updateField("stock", e.target.value)} style={inputBase} />
              </label>

              <label style={{ ...labelText, display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
                <input type="checkbox" checked={values.soldOut} onChange={(e) => updateField("soldOut", e.target.checked)} />
                Sold out
              </label>
            </div>

            <label style={labelText}>
              Short Description
              <textarea value={values.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} rows={4} style={{ ...inputBase, borderRadius: 12 }} />
            </label>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={labelText}>
                Main Image URL
                <input type="text" value={values.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} style={inputBase} />
              </label>

              <label style={labelText}>
                Upload images (multiple)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImagesFilesChange(Array.from(e.target.files || []), e.target)}
                  style={inputBase}
                />
              </label>

              {primaryThumb && (
                <div style={{ width: "100%", maxWidth: 360, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(148,122,173,0.25)", background: "#fff" }}>
                  {!imgFail ? (
                    <img
                      src={resolveAdminImageUrl(primaryThumb)}
                      alt="preview"
                      style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                      onError={() => setImgFail(true)}
                    />
                  ) : (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#7a6989", fontSize: 12, fontWeight: 800, background: "#f5effb" }}>
                      IMG
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(values.images) && values.images.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#4f3d5c", marginBottom: 6 }}>Thumbnails (click = set main, × = delete)</div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {values.images.map((img) => {
                      const src = resolveAdminImageUrl(img.url);
                      const failed = !!thumbFail[img.id];

                      return (
                        <div
                          key={img.id}
                          style={{
                            width: 74,
                            height: 74,
                            borderRadius: 14,
                            overflow: "hidden",
                            border: img.url === values.imageUrl ? "2px solid #4a2a73" : "1px solid rgba(148,122,173,0.25)",
                            background: "#fff",
                            cursor: saving ? "not-allowed" : "pointer",
                            position: "relative",
                            opacity: saving ? 0.7 : 1,
                          }}
                          onClick={() => !saving && setAsPrimary(img)}
                        >
                          {!failed ? (
                            <img
                              src={src}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={() => setThumbFail((prev) => ({ ...prev, [img.id]: true }))}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5effb", color: "#7a6989", fontSize: 11, fontWeight: 800 }}>
                              IMG
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              !saving && deleteImage(img);
                            }}
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              border: "none",
                              background: "rgba(0,0,0,0.55)",
                              color: "#fff",
                              fontWeight: 900,
                              cursor: saving ? "not-allowed" : "pointer",
                              lineHeight: "22px",
                              padding: 0,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: isMobile ? "9px 12px" : "10px 14px",
              borderRadius: 999,
              border: "none",
              background: saving ? "rgba(124,81,161,0.55)" : "linear-gradient(90deg, #7c51a1, #4a2a73)",
              fontSize: isMobile ? 12 : 13,
              cursor: saving ? "not-allowed" : "pointer",
              color: "#fff",
              fontWeight: 900,
              width: isMobile ? "100%" : 260,
              justifySelf: "start",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}