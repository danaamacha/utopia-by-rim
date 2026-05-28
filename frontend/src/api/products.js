// frontend/src/api/products.js
// Products API helpers

import { api } from "./api";

/**
 * Get all products (public)
 * Backend usually returns: { data: Product[] }  OR  Product[]
 */
export async function getProducts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.append("category", filters.category);
  if (filters.search) params.append("search", filters.search);
  if (filters.min_price != null) params.append("min_price", String(filters.min_price));
  if (filters.max_price != null) params.append("max_price", String(filters.max_price));
  if (filters.sort) params.append("sort", filters.sort);

  const query = params.toString();

  try {
    // api.get already returns parsed JSON from apiRequest
    return await api.get(`/products${query ? `?${query}` : ""}`);
  } catch (err) {
    console.error("getProducts failed:", {
      url: `/products${query ? `?${query}` : ""}`,
      status: err?.status,
      data: err?.data,
      message: err?.message,
    });
    throw err;
  }
}

/**
 * Get product by slug (public)
 * IMPORTANT: api.get returns JSON already
 * So DO NOT do res.data here (that's axios style)
 */
export async function getProductBySlug(slug) {
  const safeSlug = encodeURIComponent(slug);
  const endpoint = `/products/slug/${safeSlug}`;

  try {
    const res = await api.get(endpoint);

    // Support both response shapes:
    // A) { data: product }
    // B) product directly
    return res?.data ?? res;
  } catch (err) {
    console.error("getProductBySlug failed:", {
      url: endpoint,
      status: err?.status,
      data: err?.data,
      message: err?.message,
    });
    throw err;
  }
}

/**
 * Get best sellers (public)
 */
export async function getBestSellers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.limit != null) params.append("limit", String(filters.limit));
  if (filters.days != null) params.append("days", String(filters.days));
  if (filters.categoryId != null) params.append("categoryId", String(filters.categoryId));

  const query = params.toString();
  const endpoint = `/products/best-sellers${query ? `?${query}` : ""}`;

  try {
    return await api.get(endpoint);
  } catch (err) {
    console.error("getBestSellers failed:", {
      url: endpoint,
      status: err?.status,
      data: err?.data,
      message: err?.message,
    });
    throw err;
  }
}

/**
 * Get all categories (public)
 */
export async function getCategories() {
  try {
    return await api.get("/categories");
  } catch (err) {
    console.error("getCategories failed:", {
      url: "/categories",
      status: err?.status,
      data: err?.data,
      message: err?.message,
    });
    throw err;
  }
}

/**
 * Get category by slug (public)
 */
export async function getCategoryBySlug(slug) {
  const safeSlug = encodeURIComponent(slug);
  const endpoint = `/categories/${safeSlug}`;

  try {
    return await api.get(endpoint);
  } catch (err) {
    console.error("getCategoryBySlug failed:", {
      url: endpoint,
      status: err?.status,
      data: err?.data,
      message: err?.message,
    });
    throw err;
  }
}
