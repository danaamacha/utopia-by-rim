// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { colors } from "../../theme";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  return res.json();
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products",  label: "Products" },
  { id: "orders",    label: "Orders" },
  { id: "pages",     label: "Pages" },
  { id: "discounts", label: "Discount Codes" },
];

function formatMoney(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(n) || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

function getStatusConfig(status) {
  const map = {
    pending:    { bg: "rgba(255,193,7,0.15)",  color: "#8a6b08" },
    confirmed:  { bg: "rgba(33,150,243,0.12)", color: "#1565c0" },
    processing: { bg: "rgba(156,39,176,0.12)", color: "#6a1b9a" },
    shipped:    { bg: "rgba(3,169,244,0.12)",  color: "#04598b" },
    delivered:  { bg: "rgba(76,175,80,0.12)",  color: "#1b5e20" },
    cancelled:  { bg: "rgba(244,67,54,0.12)",  color: "#b71c1c" },
  };
  return map[status] || { bg: "rgba(158,158,158,0.12)", color: "#424242" };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const rawTab   = params.get("tab") || "dashboard";
  const activeTab = TABS.some((t) => t.id === rawTab) ? rawTab : "dashboard";
  const setActiveTab = (id) => setParams({ tab: id });

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (activeTab !== "dashboard") return;
    setLoading(true);
    fetchDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const chip = {
    display: "inline-flex", alignItems: "center", padding: "3px 9px",
    borderRadius: 999, fontSize: 11, fontWeight: 600,
    background: "rgba(212,175,55,0.14)", color: "#8b6b0f",
    letterSpacing: 0.3, textTransform: "uppercase",
  };

  const navBtn = (active) => ({
    width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 10,
    border: "none", background: active ? "rgba(124,81,161,0.13)" : "transparent",
    color: active ? colors.royalPlum || "#4a2a73" : "#4f3d5c",
    fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8,
  });

  return (
    <main style={{ minHeight: "80vh", padding: isMobile ? "84px 14px 30px" : "96px 24px 40px", background: "#f3edf7" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 20, gridTemplateColumns: isMobile ? "1fr" : "250px 1fr", alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <aside style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 10px 24px rgba(0,0,0,.05)", border: "1px solid rgba(148,122,173,0.18)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 40, width: 40, borderRadius: 14, background: "linear-gradient(145deg, #7c51a1, #4a2a73, #f5d0ff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>R</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3c274f", letterSpacing: 0.3 }}>Utopia by Rim</div>
              <div style={{ marginTop: 2 }}><span style={chip}>Owner panel</span></div>
            </div>
          </div>

          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, textDecoration: "none", color: "#6d5a7a", marginBottom: 14 }}>
            👀 View website
          </Link>

          <div style={{ height: 1, background: "rgba(180,153,201,0.4)", margin: "6px 0 10px" }} />

          <nav style={{ display: "grid", gap: 4 }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} style={navBtn(activeTab === t.id)}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: activeTab === t.id ? "#7c51a1" : "#e5d7f1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: activeTab === t.id ? "#fff" : "#6b4b8c" }}>
                  {t.label.charAt(0)}
                </span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <section style={{ background: "#fff", borderRadius: 20, padding: isMobile ? 14 : 20, boxShadow: "0 10px 26px rgba(0,0,0,.05)", border: "1px solid rgba(148,122,173,0.18)" }}>
          {activeTab === "dashboard" && (
            <DashboardTab
              stats={stats}
              loading={loading}
              error={error}
              onNewProduct={() => navigate("/admin/products/new")}
              onViewAllOrders={() => setActiveTab("orders")}
              onRetry={() => { setLoading(true); fetchDashboard().then(setStats).catch((e) => setError(e.message)).finally(() => setLoading(false)); }}
            />
          )}
          {activeTab === "products"  && <PlaceholderTab title="Products"       description="Manage all your resin pieces, stock, categories and sale prices." />}
          {activeTab === "orders"    && <PlaceholderTab title="Orders"         description="View, filter and update order statuses." />}
          {activeTab === "pages"     && <PlaceholderTab title="Pages"          description="Edit your Home, Contact, FAQ and Legal sections." />}
          {activeTab === "discounts" && <PlaceholderTab title="Discount Codes" description="Create and manage coupon codes and scheduled sales." />}
        </section>
      </div>
    </main>
  );
}

function DashboardTab({ stats, loading, error, onNewProduct, onViewAllOrders, onRetry }) {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const cardStyle = {
    borderRadius: 14, padding: 14,
    background: "linear-gradient(135deg, #f9f4ff, #f3e7ff)",
    border: "1px solid rgba(148,122,173,0.35)",
    minHeight: 90, display: "flex", flexDirection: "column", justifyContent: "space-between",
  };

  return (
    <>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#3c274f" }}>Dashboard overview</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7a6989" }}>
            Quick snapshot of today's performance for Utopia by Rim.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onRetry} disabled={loading} style={{ padding: "7px 11px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", background: "#fff", fontSize: 12, cursor: "pointer", color: "#4a2a73", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          <button type="button" onClick={onNewProduct} style={{ padding: "7px 11px", borderRadius: 999, border: "none", background: "linear-gradient(90deg, #7c51a1, #4a2a73)", fontSize: 12, cursor: "pointer", color: "#fff", fontWeight: 600 }}>
            + New product
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(244,67,54,0.07)", border: "1px solid rgba(244,67,54,0.3)", color: "#b71c1c", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: 12, marginTop: 14 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "#7a6989" }}>Today's Orders</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4a2a73" }}>
            {loading ? "—" : (stats?.todayOrders ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Non-cancelled</span>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "#7a6989" }}>Today's Sales</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4a2a73" }}>
            {loading ? "—" : formatMoney(stats?.todaySales ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Revenue today</span>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "#7a6989" }}>Open Orders</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4a2a73" }}>
            {loading ? "—" : (stats?.openOrders ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Pending / preparing</span>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "#7a6989" }}>Low Stock Items</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: stats?.lowStock > 0 ? "#b71c1c" : "#4a2a73" }}>
            {loading ? "—" : (stats?.lowStock ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Stock ≤ 5 units</span>
        </div>
      </div>

      {/* Recent orders */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>Recent orders</h2>
          <button type="button" onClick={onViewAllOrders} style={{ fontSize: 12, color: "#4a2a73", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            View all
          </button>
        </div>

        <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#7a6989", fontSize: 13 }}>Loading…</div>
          ) : !stats?.recentOrders?.length ? (
            <div style={{ padding: 20, textAlign: "center", color: "#7a6989", fontSize: 13 }}>No orders yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#f5effb" }}>
                <tr>
                  <Th>Order</Th>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th align="right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => {
                  const cfg = getStatusConfig(o.status);
                  return (
                    <tr key={o.id}>
                      <Td><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73" }}>{String(o.id).slice(0, 8)}…</span></Td>
                      <Td>{formatDate(o.createdAt)}</Td>
                      <Td>{o.customerName}</Td>
                      <Td align="right">{formatMoney(o.total, o.currency)}</Td>
                      <Td>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, textTransform: "capitalize" }}>
                          {o.status}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

function PlaceholderTab({ title, description }) {
  return (
    <>
      <h1 style={{ margin: "0 0 4px", fontSize: 20, color: "#3c274f" }}>{title}</h1>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7a6989" }}>{description}</p>
      <div style={{ borderRadius: 14, padding: 16, background: "#faf6ff", border: "1px dashed rgba(148,122,173,0.5)", fontSize: 13, color: "#7a6989" }}>
        Use the sidebar navigation in the admin panel to access this section.
      </div>
    </>
  );
}

function Th({ children, align = "left" }) {
  return <th style={{ textAlign: align, padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#4a2a73", borderBottom: "1px solid rgba(148,122,173,0.25)" }}>{children}</th>;
}

function Td({ children, align = "left" }) {
  return <td style={{ textAlign: align, padding: "8px 10px", fontSize: 12, color: "#4f3d5c", borderBottom: "1px solid rgba(148,122,173,0.13)" }}>{children}</td>;
}