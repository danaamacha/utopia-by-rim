// Cart API helpers (requires authentication)
import { api } from "./api";

/**
 * Get user's cart
 */
export async function getCart() {
  return api.get("/cart");
}

/**
 * Add item to cart
 * @param {string} productId - Product UUID
 * @param {number} quantity - Quantity to add
 */
export async function addToCart(productId, quantity) {
  return api.post("/cart/items", { productId, quantity });
}

/**
 * Update cart item quantity
 * @param {string} itemId - Cart item UUID
 * @param {number} quantity - New quantity
 */
export async function updateCartItem(itemId, quantity) {
  return api.patch(`/cart/items/${itemId}`, { quantity });
}

/**
 * Remove item from cart
 * @param {string} itemId - Cart item UUID
 */
export async function removeCartItem(itemId) {
  return api.delete(`/cart/items/${itemId}`);
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  return api.delete("/cart");
}


