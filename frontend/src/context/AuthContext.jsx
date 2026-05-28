import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "../api/auth";
import { api } from "../api/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const LS_USER_KEY = "auth_user";

// OWNER EMAIL(S) - users with admin/owner role
const OWNER_EMAILS = ["owner@utopiabyrim.com"];

function getRoleByEmail(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return "guest";
  return OWNER_EMAILS.includes(e) ? "owner" : "customer";
}

function readMe() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_USER_KEY)) || null;
    if (!raw) return null;
    const role = getRoleByEmail(raw.email);
    return { ...raw, role };
  } catch {
    return null;
  }
}

function writeMe(u) {
  const role = getRoleByEmail(u.email);
  const withRole = { ...u, role };
  localStorage.setItem(LS_USER_KEY, JSON.stringify(withRole));
}

function clearMe() {
  localStorage.removeItem(LS_USER_KEY);
  apiLogout();
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readMe());
  const [token, setToken] = useState(() => api.getToken());

  // Listen for logout events (from API 401 handler)
  useEffect(() => {
    const handleLogout = () => {
      clearMe();
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // Restore token + user on mount
  useEffect(() => {
    const storedToken = api.getToken();
    if (storedToken) {
      setToken(storedToken);
      if (!user) {
        const savedUser = readMe();
        if (savedUser) setUser(savedUser);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,

      // ---------- LOGIN (backend) ----------
      login: async (email, password) => {
        try {
          const data = await apiLogin(email, password);

          const me = data.user
            ? {
                id: data.user.id,
                name: data.user.name || "User",
                email: data.user.email,
                phone: data.user.phone || "",
                role: data.user.role || getRoleByEmail(data.user.email),
              }
            : {
                id: `local-${Date.now()}`,
                name: "User",
                email,
                phone: "",
                role: getRoleByEmail(email),
              };

          writeMe(me);
          setUser(me);
          setToken(api.getToken());
          return me;
        } catch (error) {
          throw new Error(error.message || "Login failed");
        }
      },

      // ---------- REGISTER (backend) ----------
      register: async ({ name, email, password }) => {
        try {
          const data = await apiRegister({ name, email, password });

          const me = data.user
            ? {
                id: data.user.id,
                name: data.user.name || name,
                email: data.user.email,
                phone: data.user.phone || "",
                role: data.user.role || getRoleByEmail(email),
              }
            : {
                id: `local-${Date.now()}`,
                name,
                email,
                phone: "",
                role: getRoleByEmail(email),
              };

          writeMe(me);
          setUser(me);
          setToken(api.getToken());
          return me;
        } catch (error) {
          throw new Error(error.message || "Registration failed");
        }
      },

      // ---------- LOGOUT ----------
      logout: () => {
        clearMe();
        setUser(null);
        setToken(null);
      },

      // ---------- UPDATE PROFILE (local storage only for now) ----------
      updateProfile: (patch) => {
        setUser((prev) => {
          if (!prev) return prev;
          const merged = { ...prev, ...patch };
          const role = getRoleByEmail(merged.email);
          const next = { ...merged, role };
          writeMe(next);
          return next;
        });
      },

      // ---------- RESET PASSWORD FLOW (placeholder - backend not implemented yet) ----------
      startResetFlow: (email) => {
        const resetToken = Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem(
          "reset_token",
          JSON.stringify({ email, token: resetToken, ts: Date.now() })
        );
        return resetToken;
      },

      finishReset: ({ token: resetToken }) => {
        const raw = localStorage.getItem("reset_token");
        if (!raw) throw new Error("No reset request found.");
        const data = JSON.parse(raw);
        if (!data || data.token !== resetToken)
          throw new Error("Invalid or expired token.");
        localStorage.removeItem("reset_token");
        return true;
      },
    }),
    [token, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
