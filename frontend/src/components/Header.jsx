// frontend/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { colors } from "../theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { useAuth } from "../auth/AuthContext"; // safe even if provider missing

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  // ✅ SAFE: if AuthProvider isn’t mounted yet, useAuth() may be null -> fallback to {}
  const auth = useAuth() || {};
  const user = auth.user || null;
  const logout = auth.logout || (() => {});

  // 👉 Decide where the user icon should go
  const accountHref = !user
    ? "/login"
    : user.role === "owner"
    ? "/admin"
    : "/account/profile";

  const accountTitle = !user
    ? "Login / Register"
    : user.role === "owner"
    ? "Admin dashboard"
    : "Account";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const hoverColor = "#9a8ba0";

  const linkBase = (active) => ({
    textDecoration: "none",
    color: "#fff",
    fontWeight: active ? 700 : 500,
    padding: "10px 14px",
    borderRadius: 8,
    display: "block",
    cursor: "pointer",
  });

  // Smooth scroll helper
  const scrollToId = (id) => (e) => {
    e.preventDefault();
    const doScroll = () => {
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (loc.pathname !== "/") {
      navigate("/", { replace: false });
      setTimeout(doScroll, 60);
    } else {
      doScroll();
    }
    setOpen(false);
  };

  function RouteItem({ to, label }) {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        style={linkBase(active)}
        onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
      >
        {label}
      </Link>
    );
  }

  function ScrollItem({ hash, label }) {
    return (
      <a
        href={hash}
        style={linkBase(false)}
        onClick={scrollToId(hash)}
        onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
      >
        {label}
      </a>
    );
  }

  const CartIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h13l-1.2 6H8.6L7 7Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9.5" cy="19" r="1.6" fill="currentColor" />
      <circle cx="18" cy="19" r="1.6" fill="currentColor" />
      <path d="M7 7 5.5 3H3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );

  const UserIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19.2c0-3.2 3.2-5.2 7-5.2s7 2 7 5.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );

  const LogoutIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 19H5a2 2 0 01-2-2V7a2 2 0 012-2h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  /* ========== MOBILE ========== */
  if (isMobile) {
    return (
      <>
        <header
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: "92%",
            height: 60,
            zIndex: 80,
            borderRadius: 50,
            background: scrolled ? colors.royalPlum : "rgba(0,0,0,0.25)",
            backdropFilter: scrolled ? "none" : "blur(8px)",
            boxShadow: scrolled ? "0 4px 18px rgba(0,0,0,.15)" : "0 0 10px rgba(255,255,255,.2)",
            transition: "background-color .35s ease, box-shadow .35s ease",
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Burger */}
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            style={{ background: "transparent", border: "none", color: "#fff", padding: 8, cursor: "pointer" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Center: Logo on scroll */}
          {scrolled && (
            <Link to="/" aria-label="Home" style={{ display: "flex", alignItems: "center" }}>
              <img src="/rim_logo.png" alt="Utopia by Rim" style={{ height: 34, width: "auto" }} />
            </Link>
          )}

          {/* Right: Icons pinned to corner */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              to={accountHref}
              title={accountTitle}
              style={{ color: "#fff", display: "inline-flex", alignItems: "center", padding: 6 }}
            >
              <UserIcon />
            </Link>

            {user && (
              <button
                type="button"
                title="Logout"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <LogoutIcon />
              </button>
            )}

            <Link
              to="/cart"
              title="Cart"
              style={{ color: "#fff", display: "inline-flex", alignItems: "center", padding: 6 }}
            >
              <CartIcon />
            </Link>
          </div>
        </header>

        {/* Overlay */}
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: open ? "rgba(0,0,0,.35)" : "transparent",
            transition: "background .25s ease",
            pointerEvents: open ? "auto" : "none",
            zIndex: 70,
          }}
        />

        {/* Drawer */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: "78%",
            maxWidth: 360,
            background: colors.royalPlum,
            color: "#fff",
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: "transform .3s ease",
            zIndex: 90,
            display: "flex",
            flexDirection: "column",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/rim_logo.png" alt="Utopia by Rim" style={{ height: 36, width: "auto", borderRadius: 8 }} />
              <span style={{ fontWeight: 700, color: "#d4af37", fontSize: 17, letterSpacing: 0.5 }}>
                UTOPIA by Rim
              </span>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              style={{ background: "transparent", border: "none", color: "#fff", padding: 8, cursor: "pointer" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <nav style={{ display: "grid", gap: 6, marginTop: 20 }}>
            <RouteItem to="/" label="Home" />
            <ScrollItem hash="#about" label="About" />
            <RouteItem to="/shop" label="Shop" />
            <ScrollItem hash="#services" label="Services" />
            <ScrollItem hash="#contact" label="Contact" />
          </nav>
        </aside>
      </>
    );
  }

  /* ========== DESKTOP ========== */
  return (
    <header
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        height: 68,
        zIndex: 60,
        borderRadius: 50,
        background: scrolled ? colors.royalPlum : "rgba(255,255,255,0.08)",
        backdropFilter: scrolled ? "none" : "blur(8px)",
        boxShadow: scrolled ? "0 4px 18px rgba(0,0,0,.15)" : "0 0 10px rgba(255,255,255,.2)",
        transition: "background-color .35s ease, box-shadow .35s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: "100%",
          padding: "0 28px",
          display: "grid",
          alignItems: "center",
          gap: 12,
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        {/* LEFT NAV */}
        <div style={{ display: "flex", gap: 18, justifyContent: "flex-end", alignItems: "center" }}>
          <RouteItem to="/" label="Home" />
          <ScrollItem hash="#about" label="About" />
          <RouteItem to="/shop" label="Shop" />
        </div>

        {/* CENTER LOGO */}
        {scrolled ? (
          <Link to="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0 6px" }}>
            <img src="/rim_logo.png" alt="Utopia by Rim" style={{ height: 40, width: "auto" }} />
          </Link>
        ) : (
          <div />
        )}

        {/* RIGHT NAV + ICONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, justifyContent: "flex-start" }}>
          <ScrollItem hash="#services" label="Services" />
          <ScrollItem hash="#contact" label="Contact" />

          {/* spacer pushes icons to extreme right */}
          <div style={{ flex: 1 }} />

          <Link
            to={accountHref}
            title={accountTitle}
            style={{
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              textDecoration: "none",
              transition: "color .25s ease",
              marginLeft: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <UserIcon />
          </Link>

          {user && (
            <button
              type="button"
              title="Logout"
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "color .25s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            >
              <LogoutIcon />
            </button>
          )}

          <Link
            to="/cart"
            title="Cart"
            style={{
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              textDecoration: "none",
              transition: "color .25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <CartIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
