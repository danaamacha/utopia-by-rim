// frontend/src/pages/admin/adminProductsUtils.js

import { CATALOG as SHOP_CATALOG } from "../../data/catalog";

/* ---------- LocalStorage ---------- */

export const LS_ADMIN_PRODUCTS = "admin_products_state";

export function readAdminState() {
  try {
    const raw = localStorage.getItem(LS_ADMIN_PRODUCTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeAdminState(obj) {
  try {
    localStorage.setItem(LS_ADMIN_PRODUCTS, JSON.stringify(obj));
  } catch {
    // ignore write errors
  }
}

/* ---------- Helpers ---------- */

export function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build full product list (catalog + admin added + overrides)
 */
export function getMergedProducts(adminState) {
  const base = SHOP_CATALOG || [];
  const overrides = adminState || {};

  const byId = new Map();

  // 1) base catalog items
  base.forEach((p) => {
    const ov = overrides[p.id] || {};
    byId.set(p.id, {
      ...p,
      ...ov,
      soldOut: !!ov.soldOut,
      deleted: !!ov.deleted,
    });
  });

  // 2) newly added admin-only items
  Object.entries(overrides).forEach(([id, ov]) => {
    if (ov.isNew && !ov.deleted && !byId.has(id)) {
      byId.set(id, {
        id,
        name: ov.name || "Untitled product",
        cat: ov.cat || "",
        price: toNumber(ov.price ?? 0),
        salePrice:
          ov.salePrice !== undefined && ov.salePrice !== null
            ? toNumber(ov.salePrice)
            : undefined,
        image: ov.image || "",
        short: ov.short || "",
        soldOut: !!ov.soldOut,
        deleted: !!ov.deleted,
      });
    }
  });

  // 3) remove deleted
  return Array.from(byId.values()).filter((p) => !p.deleted);
}

/**
 * Alias for older code: buildMergedProducts === getMergedProducts
 * (so AdminProductList still works)
 */
export const buildMergedProducts = getMergedProducts;

/**
 * Find ONE product by ID from merged list
 */
export function findMergedProductById(adminState, id) {
  const list = getMergedProducts(adminState);
  return list.find((p) => p.id === id) || null;
}
