// Orders API helpers (requires authentication)
import { api } from "./api";

/**
 * Get user's orders (with filters)
 */
export async function getMyOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.sort) params.append("sort", filters.sort);

  const query = params.toString();
  return api.get(`/orders/my${query ? `?${query}` : ""}`);
}

/**
 * Get order by ID (user's own order only)
 */
export async function getOrderById(orderId) {
  return api.get(`/orders/${orderId}`);
}

/**
 * Checkout (create order from cart)
 * @param {object} checkoutData - { fullName, phone, addressLine1, addressLine2?, city, state, country, postalCode, paymentMethod }
 */
export async function checkout(checkoutData) {
  return api.post("/orders/checkout", checkoutData);
}

/**
 * Cancel order (only if status is pending)
 * @param {string} orderId - Order UUID
 * @param {string} note - Optional cancellation note
 */
export async function cancelOrder(orderId, note) {
  return api.patch(`/orders/${orderId}/cancel`, { note });
}


