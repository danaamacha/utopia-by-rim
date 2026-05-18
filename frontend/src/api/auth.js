// Auth API helpers
import { api } from "./api";

/**
 * Login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
export async function login(email, password) {
  const data = await api.post("/auth/login", { email, password });
  // Store token
  if (data.token) {
    api.setToken(data.token);
  }
  return data;
}

/**
 * Register
 * @param {object} userData - { name, email, password }
 * @returns {Promise<{token: string, user: object}>}
 */
export async function register(userData) {
  const data = await api.post("/auth/register", userData);
  // Store token
  if (data.token) {
    api.setToken(data.token);
  }
  return data;
}

/**
 * Logout (clear token)
 */
export function logout() {
  api.setToken(null);
}


