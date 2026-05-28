import api from "./api"; 

export async function getCart() {
  return await api.get("/cart");
}

export async function addToCart(productId, quantity = 1) {
  return await api.post("/cart/items", { productId, quantity });
}

export async function updateCartItem(cartItemId, quantity) {
  return await api.patch(`/cart/items/${cartItemId}`, { quantity });
}

export async function removeCartItem(cartItemId) {
  return await api.delete(`/cart/items/${cartItemId}`);
}

export async function clearCart() {
  return await api.delete("/cart");
}
