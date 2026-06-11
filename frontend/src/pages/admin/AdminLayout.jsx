// frontend/src/pages/admin/AdminLayout.jsx
import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { colors } from "../../theme";
import { useAuth } from "../../auth/AuthContext";

const TABS = [
  { id: "dashboard", label: "Dashboard", to: "/admin" },
  { id: "products", label: "Products", to: "/admin/products" },
  { id: "orders", label: "Orders", to: "/admin/orders" },
  { id: "customers", label: "Customers", to: "/admin/customers" },
  { id: "pages", label: "Pages", to: "/admin/pages" },
  { id: "discounts", label: "Discount Codes", to: "/admin/discounts" },
  { id: "settings", label: "Settings", to: "/admin/settings" },
];

export default function AdminLayout() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const { user, logout } = useAuth() || {};
  const nav = useNavigate();

  const userName = user?.name || user?.email || "Rim";

  const wrapperStyle = {
    minHeight: "80vh",
    padding: isMobile ? "84px 14px 30px" : "96px 24px 40px",
    background: "#51265e", // 💜 your shade
  };

  const layoutStyle = {
    maxWidth: 1240,
    margin: "0 auto",
    display: "grid",
    gap: 20,
    gridTemplateColumns: isMobile ? "1fr" : "250px 1fr",
    alignItems: "flex-start",
  };

  const sidebarCard = {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,.05)",
    border: "1px solid rgba(148,122,173,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const chip = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: "rgba(212,175,55,0.14)",
    color: "#8b6b0f",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  };

  const navLinkBase = (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 10,
    border: "none",
    background: active ? "rgba(124,81,161,0.13)" : "transparent",
    color: active ? colors.royalPlum || "#4a2a73" : "#4f3d5c",
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  });

  const handleLogout = () => {
    if (logout) logout();            // clear auth_user
    nav("/", { replace: true });     // go back to home
  };

  return (
    <main style={wrapperStyle}>
      <div style={layoutStyle}>
        {/* SIDEBAR */}
        <aside style={sidebarCard}>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: 40,
                width: 40,
                borderRadius: 14,
                background:
                  "linear-gradient(145deg, #7c51a1, #4a2a73, #f5d0ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              R
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#3c274f",
                  letterSpacing: 0.3,
                }}
              >
                Utopia by Rim
              </div>
              <div style={{ marginTop: 2 }}>
                <span style={chip}>Owner panel</span>
              </div>
            </div>
          </div>

          {/* quick link */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              textDecoration: "none",
              color: "#6d5a7a",
              marginBottom: 10,
            }}
          >
            <span>👀 View website</span>
          </Link>

          <div
            style={{
              height: 1,
              background: "rgba(180,153,201,0.4)",
              margin: "4px 0 8px",
            }}
          />

          {/* nav */}
          <nav style={{ display: "grid", gap: 4, marginBottom: 10 }}>
            {TABS.map((t) => (
              <NavLink
                key={t.id}
                to={t.to}
                end={t.to === "/admin"}
                style={({ isActive }) => navLinkBase(isActive)}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: "#e5d7f1",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#6b4b8c",
                  }}
                >
                  {t.label.charAt(0)}
                </span>
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* bottom user + logout */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 8,
              borderTop: "1px solid rgba(180,153,201,0.4)",
              fontSize: 12,
            }}
          >
            <div style={{ color: "#7a6989", marginBottom: 2 }}>
              Logged in as
            </div>
            <div
              style={{
                fontWeight: 600,
                color: "#3c274f",
                marginBottom: 6,
              }}
            >
              {userName}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                background: "rgba(124,81,161,0.12)",
                color: "#4a2a73",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <section
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: isMobile ? 14 : 20,
            boxShadow: "0 10px 26px rgba(0,0,0,.05)",
            border: "1px solid rgba(148,122,173,0.18)",
          }}
        >
          <Outlet />
        </section>
      </div>
    </main>
  );
}
