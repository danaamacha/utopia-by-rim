import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const LS_USER_KEY = "auth_user";
const LS_TOKEN_KEY = "auth_token";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function readMe() {
  try {
    return JSON.parse(localStorage.getItem(LS_USER_KEY)) || null;
  } catch {
    return null;
  }
}
function writeMe(u) {
  localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
}
function clearMe() {
  localStorage.removeItem(LS_USER_KEY);
  localStorage.removeItem(LS_TOKEN_KEY);
}
// Logout clears local session state only — the user's backend cart is
// preserved and restored on next login (CartContext handles merge/fetch).
function clearCartData() {
  localStorage.removeItem("cart_v1");
  localStorage.removeItem("last_order");
}

export function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY) || null;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readMe());

  const value = useMemo(
    () => ({
      user,

      // ---------- LOGIN ----------
      login: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Invalid email or password.");
        }

        const data = await res.json();
        localStorage.setItem(LS_TOKEN_KEY, data.token);

        const me = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        };
        writeMe(me);
        setUser(me);
      },

      // ---------- REGISTER ----------
      register: async ({ name, email, phone, password }) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: phone?.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Registration failed.");
        }

        const data = await res.json();
        localStorage.setItem(LS_TOKEN_KEY, data.token);

        const me = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        };
        writeMe(me);
        setUser(me);
      },

      // ---------- LOGOUT ----------
      logout: () => {
        clearMe();
        clearCartData();
        setUser(null);
      },

      // ---------- UPDATE PROFILE (local display only) ----------
      updateProfile: (patch) => {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          writeMe(next);
          return next;
        });
      },
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
