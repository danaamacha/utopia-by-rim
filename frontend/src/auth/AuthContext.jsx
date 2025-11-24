import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const LS_USER_KEY = "auth_user";
const LS_USERS_KEY = "users_db"; // array of {id,name,email,phone,password}

// 👉 OWNER EMAIL(S) – Rim only
const OWNER_EMAILS = ["rim@utopiabyrim.com"]; // add more owner emails if ever needed

function getRoleByEmail(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return "guest";
  return OWNER_EMAILS.includes(e) ? "owner" : "customer";
}

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function writeUsers(arr) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(arr));
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
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readMe());

  useEffect(() => {
    // Seed Rim (owner) + demo user into local "DB"
    const db = readUsers();
    let changed = false;

    // 1) Ensure Rim admin exists
    const rimEmail = "rim@utopiabyrim.com";
    if (!db.some((u) => u.email.toLowerCase() === rimEmail.toLowerCase())) {
      db.push({
        id: "u_owner_rim",
        name: "Rim (Owner)",
        email: rimEmail,
        phone: "+96170000000",
        password: "Rim2024", // 🔐 ADMIN PASSWORD
      });
      changed = true;
    }

    // 2) Ensure demo user exists (optional, for testing)
    const demoEmail = "demo@utopia.com";
    if (!db.some((u) => u.email.toLowerCase() === demoEmail.toLowerCase())) {
      db.push({
        id: "u1",
        name: "Rim Demo",
        email: demoEmail,
        phone: "+96170000000",
        password: "123456",
      });
      changed = true;
    }

    if (changed) {
      writeUsers(db);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,

      // ---------- LOGIN ----------
      login: async (email, password) => {
        const db = readUsers();
        const u = db.find(
          (x) =>
            x.email.toLowerCase() === email.toLowerCase() &&
            x.password === password
        );
        if (!u) throw new Error("Invalid email or password.");

        const me = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: getRoleByEmail(u.email),
        };

        writeMe(me);
        setUser(me);
      },

      // ---------- REGISTER ----------
      register: async ({ name, email, phone, password }) => {
        const db = readUsers();
        if (db.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("Email already registered.");
        }
        const id = "u" + Date.now().toString(36);
        const rec = { id, name, email, phone, password };
        db.push(rec);
        writeUsers(db);

        const me = {
          id,
          name,
          email,
          phone,
          role: getRoleByEmail(email),
        };
        writeMe(me);
        setUser(me);
      },

      logout: () => {
        clearMe();
        setUser(null);
      },

      // ---------- UPDATE PROFILE ----------
      updateProfile: (patch) => {
        setUser((prev) => {
          if (!prev) return prev;
          const merged = { ...prev, ...patch };
          const role = getRoleByEmail(merged.email);
          const next = { ...merged, role };

          writeMe(next);

          const db = readUsers();
          const i = db.findIndex((x) => x.id === prev.id);
          if (i >= 0) {
            db[i] = { ...db[i], ...patch };
            writeUsers(db);
          }
          return next;
        });
      },

      // ---------- RESET PASSWORD FLOW ----------
      startResetFlow: (email) => {
        const token = Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem(
          "reset_token",
          JSON.stringify({ email, token, ts: Date.now() })
        );
        return token;
      },

      finishReset: ({ token, newPassword }) => {
        const raw = localStorage.getItem("reset_token");
        if (!raw) throw new Error("No reset request found.");
        const data = JSON.parse(raw);
        if (!data || data.token !== token)
          throw new Error("Invalid or expired token.");

        const db = readUsers();
        const idx = db.findIndex(
          (x) => x.email.toLowerCase() === data.email.toLowerCase()
        );
        if (idx < 0) throw new Error("User not found.");
        db[idx].password = newPassword;
        writeUsers(db);
        localStorage.removeItem("reset_token");
        return true;
      },
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
