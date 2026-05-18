// frontend/src/pages/admin/AdminOverview.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed (${res.status})`);
  return res.json();
}

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

export default function AdminOverview() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cardStyle = {
    borderRadius: 14, padding: 14,
    background: "linear-gradient(135deg, #f9f4ff, #f3e7ff)",
    border: "1px solid rgba(148,122,173,0.35)",
    minHeight: 90, display: "flex", flexDirection: "column", justifyContent: "space-between",
  };

  const sub   = { fontSize: 12, color: "#7a6989" };
  const value = { fontSize: 20, fontWeight: 800, color: "#4a2a73" };

  return (
    <>
      {/* HEADER */}
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#3c274f" }}>Dashboard overview</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7a6989" }}>
            Quick snapshot of today's performance for Utopia by Rim.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={load} disabled={loading} style={{
            padding: "7px 11px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)",
            background: "#fff", fontSize: 12, cursor: loading ? "not-allowed" : "pointer",
            color: "#4a2a73", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          <Link to="/admin/products/new" style={{
            padding: "7px 11px", borderRadius: 999, border: "none",
            background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
            fontSize: 12, cursor: "pointer", color: "#fff", fontWeight: 600, textDecoration: "none",
          }}>
            + New product
          </Link>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(244,67,54,0.07)", border: "1px solid rgba(244,67,54,0.3)", color: "#b71c1c", fontSize: 13 }}>
          ⚠ {error} — <button onClick={load} style={{ background: "none", border: "none", color: "#b71c1c", cursor: "pointer", fontWeight: 600, padding: 0 }}>Retry</button>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: 12, marginTop: 14 }}>
        <div style={cardStyle}>
          <div style={sub}>Today's Orders</div>
          <div style={value}>{loading ? "—" : (stats?.todayOrders ?? 0)}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Non-cancelled</span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Today's Sales</div>
          <div style={value}>{loading ? "—" : formatMoney(stats?.todaySales ?? 0)}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Revenue today</span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Open Orders</div>
          <div style={value}>{loading ? "—" : (stats?.openOrders ?? 0)}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Pending / preparing</span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Low Stock Items</div>
          <div style={{ ...value, color: stats?.lowStock > 0 ? "#b71c1c" : "#4a2a73" }}>
            {loading ? "—" : (stats?.lowStock ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Stock ≤ 5 units</span>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>Recent orders</h2>
          <Link to="/admin/orders" style={{ fontSize: 12, color: "#4a2a73", textDecoration: "none" }}>View all</Link>
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

function Th({ children, align = "left" }) {
  return <th style={{ textAlign: align, padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#4a2a73", borderBottom: "1px solid rgba(148,122,173,0.25)" }}>{children}</th>;
}

function Td({ children, align = "left" }) {
  return <td style={{ textAlign: align, padding: "8px 10px", fontSize: 12, color: "#4f3d5c", borderBottom: "1px solid rgba(148,122,173,0.13)" }}>{children}</td>;
}