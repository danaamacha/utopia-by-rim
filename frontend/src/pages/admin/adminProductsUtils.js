// frontend/src/pages/admin/adminProductsUtils.js

// =======================
// BASES
// =======================
const RAW_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_BASE ||
  "http://localhost:3001/api";

// API base always ends with /api
const API_BASE = String(RAW_BASE).replace(/\/+$/, "").endsWith("/api")
  ? String(RAW_BASE).replace(/\/+$/, "")
  : `${String(RAW_BASE).replace(/\/+$/, "")}/api`;

// Files base MUST NOT include /api
const FILES_BASE = API_BASE.replace(/\/api\/?$/i, "");

// =======================
// IMAGE URL RESOLVERS
// =======================
export function resolveImageUrl(url) {
  if (!url) return null;

  const clean = String(url).trim();

  if (/^https?:\/\//i.test(clean)) return clean;

  const normalized = clean.startsWith("uploads/")
    ? `/${clean}`
    : clean;

  if (normalized.startsWith("/uploads/"))
    return `${FILES_BASE}${normalized}`;

  return normalized.startsWith("/")
    ? `${FILES_BASE}${normalized}`
    : `${FILES_BASE}/${normalized}`;
}

export function resolveAdminImageUrl(url) {
  return resolveImageUrl(url);
}

export function pickProductImage(product) {
  return (
    product?.imageUrl ||
    product?.image ||
    product?.images?.[0]?.url ||
    null
  );
}

// =======================
// TOKEN RESOLVER
// =======================
function extractTokenFromJson(raw) {
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("eyJ") && raw.length > 20) return raw;

  try {
    const obj = JSON.parse(raw);
    const direct =
      obj?.accessToken ||
      obj?.token ||
      obj?.jwt ||
      obj?.access_token;

    if (typeof direct === "string" && direct.length > 20)
      return direct;
  } catch {}

  return "";
}

function getToken() {
  const keys = [
    "accessToken",
    "token",
    "jwt",
    "auth_token",
    "access_token",
    "utopia_token",
  ];

  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.length > 20) return v;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const raw = localStorage.getItem(localStorage.key(i));
    const t = extractTokenFromJson(raw);
    if (t) return t;
  }

  return "";
}

// =======================
// SLUG
// =======================
export function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function ensureSlug(dto) {
  const out = { ...(dto || {}) };
  if (!out.slug) out.slug = slugify(out.name || "");
  return out;
}

// =======================
// API FETCH
// =======================


// =======================
// PRODUCTS (ADMIN)
// =======================
export async function adminGetProducts() {
  const payload = await apiFetch(`/admin/products`, {
    method: "GET",
  });
  return payload?.data ?? payload ?? [];
}

export async function adminGetProduct(id) {
  const payload = await apiFetch(
    `/admin/products/${encodeURIComponent(id)}`,
    { method: "GET" }
  );
  return payload?.data ?? payload;
}

export async function adminCreateProduct(dto) {
  const fixed = ensureSlug(dto);
  const payload = await apiFetch(`/admin/products`, {
    method: "POST",
    body: fixed,
  });
  return payload?.data ?? payload;
}

export async function adminUpdateProduct(id, dto) {
  const fixed = ensureSlug(dto);
  const payload = await apiFetch(
    `/admin/products/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: fixed,
    }
  );
  return payload?.data ?? payload;
}

export async function adminDeleteProduct(id) {
  const payload = await apiFetch(
    `/admin/products/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  return payload?.data ?? payload;
}

// =======================
// IMAGE UPLOAD
// FIRST IMAGE = MAIN IMAGE
// =======================
// =======================
// API FETCH
// =======================
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const isForm = opts.body instanceof FormData;

  const headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ✅ IMPORTANT: only set content-type for JSON
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    body: isForm
      ? opts.body
      : opts.body
      ? JSON.stringify(opts.body)
      : undefined,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  return data;
}

// =======================
// IMAGE UPLOAD
// =======================
export async function adminUploadProductImage(productId, file, opts = {}) {
  if (!productId) throw new Error("Missing productId");
  if (!file) throw new Error("Missing file");

  const { isPrimary = false, position } = opts;

  const form = new FormData();
  form.append("file", file); // ✅ must be "file" (FileInterceptor('file'))
  form.append("isPrimary", isPrimary ? "true" : "false");
  if (typeof position === "number") form.append("position", String(position));

  // ✅ return whatever backend returns (image or product or wrapper)
  const payload = await apiFetch(
    `/admin/products/${encodeURIComponent(productId)}/images`,
    { method: "POST", body: form }
  );

  return payload?.data ?? payload;
}
// =======================
// DELETE IMAGE
// =======================
export async function adminDeleteProductImage(
  productId,
  imageId
) {
  if (!productId) throw new Error("Missing productId");
  if (!imageId) throw new Error("Missing imageId");

  return apiFetch(
    `/admin/products/${encodeURIComponent(
      productId
    )}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" }
  );
}

// =======================
// HELPERS
// =======================
export function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export { API_BASE, FILES_BASE };