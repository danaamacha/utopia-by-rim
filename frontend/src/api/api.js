// frontend/src/api/api.js
// Centralized API helper for backend integration (Vite + NestJS)

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:3001/api";

// ✅ USE ONE TOKEN KEY EVERYWHERE
const LS_TOKEN_KEY = "auth_token";

/* =========================
   Token helpers
========================= */
function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(LS_TOKEN_KEY, token);
  else localStorage.removeItem(LS_TOKEN_KEY);
}

/* =========================
   Core request wrapper
========================= */
async function apiRequest(endpoint, options = {}) {
  // ✅ make sure endpoint always starts with "/"
  const ep = endpoint?.startsWith("/") ? endpoint : `/${endpoint || ""}`;
  const url = `${API_BASE}${ep}`;

  const token = getToken();

  const isAuthEndpoint =
    ep.startsWith("/auth/login") || ep.startsWith("/auth/register");

  const isPublicEndpoint =
    isAuthEndpoint ||
    ep.startsWith("/products") ||
    ep.startsWith("/categories") ||
    ep.startsWith("/contact");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach Authorization only when needed
  if (token && !isPublicEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // ✅ include URL in the error for easier debugging
    const e = new Error(
      `Network error. Cannot reach API at ${url}. Is the backend running?`
    );
    e.cause = err;
    e.url = url;
    throw e;
  }

  // 🔐 Handle unauthorized (token expired)
  if (response.status === 401 && !isAuthEndpoint) {
    setToken(null);
    window.dispatchEvent(new CustomEvent("auth:logout"));
    const err = new Error("Session expired. Please login again.");
    err.status = 401;
    throw err;
  }

  // ✅ parse JSON safely (also handle empty responses)
  let data = null;
  const ct = response.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) data = await response.json();
    else {
      const text = await response.text();
      data = text || null;
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data?.message) ||
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      `Request failed (${response.status})`;

    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    err.url = url;
    err.endpoint = ep;
    throw err;
  }

  return data; // ✅ ALWAYS returns data when successful
}

/* =========================
   HTTP helpers
========================= */
async function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: "GET" });
}

async function post(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

async function patch(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
  });
}

async function del(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: "DELETE" });
}

/* =========================
   Build API object
========================= */
const api = {
  get,
  post,
  patch,
  delete: del,
  getToken,
  setToken,
  API_BASE,
  apiRequest, // ✅ export raw wrapper too (useful for debugging)
};

// ✅ IMPORTANT: export BOTH named + default
export { api, apiRequest };
export default api;
