// Contact API helpers (public)
import { api } from "./api";

/**
 * Submit contact form
 * @param {object} data - { name, email, phone?, subject, message }
 */
export async function submitContact(data) {
  return api.post("/contact", data);
}


