import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); }
  catch { return String(d); }
}

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function getStatusConfig(status) {
  const map = {
    pending:    { label: "Pending",    bg: "rgba(255,193,7,.15)",  color: "#795548" },
    confirmed:  { label: "Confirmed",  bg: "rgba(33,150,243,.15)", color: "#1565c0" },
    processing: { label: "Processing", bg: "rgba(156,39,176,.12)", color: "#6a1b9a" },
    shipped:    { label: "Shipped",    bg: "rgba(3,169,244,.15)",  color: "#0277bd" },
    delivered:  { label: "Delivered",  bg: "rgba(76,175,80,.15)",  color: "#2e7d32" },
    cancelled:  { label: "Cancelled",  bg: "rgba(244,67,54,.15)",  color: "#b71c1c" },
  };
  return map[(status || "pending").toLowerCase()] || map.pending;
}

export default function AdminOrders() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/orders`, { headers: authHeaders() })
      .then((r) => { if (!r.ok) throw new Error("Failed to load orders"); return r.json(); })
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data || data.orders || [];
        arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(arr);
        if (arr.length > 0) setSelectedId(arr[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const textMatch = !q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.fullName && o.fullName.toLowerCase().includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q));
      const statusMatch = statusFilter === "all" || (o.status || "pending").toLowerCase() === statusFilter;
      return textMatch && statusMatch;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = useMemo(
    () => filtered.find((o) => o.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const updateStatus = async (id, newStatus) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to update status.");
        // Rollback on failure — re-fetch
        fetch(`${API_BASE}/admin/orders`, { headers: authHeaders() })
          .then((r) => r.json())
          .then((data) => { const arr = Array.isArray(data) ? data : data.data || []; setOrders(arr); })
          .catch(() => {});
      }
    } catch {
      alert("Network error updating order status.");
    }
  };

  return (
    <div style={{ padding: isMobile ? 8 : 12 }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Orders</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>Track customer orders, update statuses and review details.</p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>Showing {filtered.length} of {orders.length} orders.</p>
        </div>
      </header>

      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff2f2", border: "1px solid #f5c2c2", color: "#a33", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: isMobile ? "1 1 100%" : "1 1 260px", minWidth: isMobile ? 0 : 200 }}>
          <input type="text" placeholder="Search by ID, name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: isMobile ? "9px 10px" : "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: isMobile ? 12 : 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: isMobile ? "1 1 100%" : "0 0 200px", minWidth: isMobile ? 0 : 160 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", padding: isMobile ? "9px 10px" : "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: isMobile ? 12 : 13, backgroundColor: "#fff", boxSizing: "border-box" }}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#7a6989", fontSize: 13 }}>Loading orders…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr", gap: 14, alignItems: "flex-start" }}>
          <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", overflow: "hidden" }}>
            {isMobile
              ? <OrderCardsMobile orders={filtered} selectedId={selectedId} setSelectedId={setSelectedId} updateStatus={updateStatus} />
              : <OrderTableDesktop orders={filtered} selectedId={selectedId} setSelectedId={setSelectedId} updateStatus={updateStatus} />
            }
          </div>
          {!isMobile && <OrderDetailsPanel order={selectedOrder} />}
        </div>
      )}

      {isMobile && selectedOrder && !loading && (
        <div style={{ marginTop: 14 }}>
          <OrderDetailsPanel order={selectedOrder} />
        </div>
      )}
    </div>
  );
}

function OrderTableDesktop({ orders, selectedId, setSelectedId, updateStatus }) {
  if (orders.length === 0) return <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>No orders found.</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead style={{ background: "#f5effb" }}>
        <tr>
          <Th>ID</Th>
          <Th>Customer</Th>
          <Th>Date</Th>
          <Th align="right">Total</Th>
          <Th>Status</Th>
          <Th align="right">Update</Th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const active = o.id === selectedId;
          const cfg = getStatusConfig(o.status);
          return (
            <tr key={o.id} onClick={() => setSelectedId(o.id)} style={{ background: active ? "#f9f3ff" : "#fff", cursor: "pointer" }}>
              <Td><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73" }}>{o.id.slice(0, 8)}…</span></Td>
              <Td>
                <div style={{ fontWeight: 600, color: "#3c274f" }}>{o.fullName || "—"}</div>
                <div style={{ fontSize: 11, color: "#7a6989", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{o.email || "—"}</div>
              </Td>
              <Td>{formatDate(o.createdAt)}</Td>
              <Td align="right">{formatMoney(o.total)}</Td>
              <Td>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </Td>
              <Td align="right">
                <select value={(o.status || "pending").toLowerCase()} onChange={(e) => updateStatus(o.id, e.target.value)} onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 11, padding: "5px 7px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)", backgroundColor: "#fff" }}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
                </select>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OrderCardsMobile({ orders, selectedId, setSelectedId, updateStatus }) {
  if (orders.length === 0) return <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>No orders found.</div>;
  return (
    <div style={{ display: "grid", gap: 10, padding: 10 }}>
      {orders.map((o) => {
        const active = o.id === selectedId;
        const cfg = getStatusConfig(o.status);
        const itemCount = (o.items || []).reduce((s, it) => s + (it.quantity || it.qty || 1), 0);
        return (
          <div key={o.id} onClick={() => setSelectedId(o.id)}
            style={{ borderRadius: 14, border: active ? "1px solid rgba(124,81,161,0.9)" : "1px solid rgba(148,122,173,0.4)", background: active ? "#f9f3ff" : "#fff", padding: 10, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73" }}>{o.id.slice(0, 12)}…</div>
                <div style={{ fontSize: 11, color: "#7a6989" }}>{formatDate(o.createdAt)}</div>
              </div>
              <span style={{ alignSelf: "flex-start", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{o.fullName || "—"}</div>
            <div style={{ fontSize: 11, color: "#7a6989", marginBottom: 2 }}>
              {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""} · ` : ""}{formatMoney(o.total)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <select value={(o.status || "pending").toLowerCase()} onChange={(e) => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                style={{ fontSize: 11, padding: "5px 7px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)", backgroundColor: "#fff", flex: 1 }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
              </select>
              <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}
                style={{ fontSize: 11, padding: "5px 9px", borderRadius: 999, border: "none", background: "linear-gradient(90deg,#7c51a1,#4a2a73)", color: "#fff", fontWeight: 600 }}>
                View
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderDetailsPanel({ order }) {
  if (!order) return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", padding: 14, background: "#faf6ff", fontSize: 13, color: "#7a6989" }}>
      Select an order to view details.
    </div>
  );

  const items = order.items || order.orderItems || [];
  const itemCount = items.reduce((s, it) => s + (it.quantity || it.qty || 1), 0);
  const address = [order.addressLine1, order.city, order.country].filter(Boolean).join(", ");

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", padding: 14, background: "#faf6ff", display: "grid", gap: 8 }}>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73", wordBreak: "break-all" }}>{order.id}</div>
        <div style={{ fontSize: 11, color: "#7a6989", marginTop: 2 }}>{formatDate(order.createdAt)}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{order.fullName || "—"}</div>
        <div style={{ fontSize: 12, color: "#7a6989" }}>{order.email || "—"}</div>
        {order.phone && <div style={{ fontSize: 12, color: "#7a6989" }}>{order.phone}</div>}
      </div>
      {address && <div style={{ fontSize: 12, color: "#4f3d5c" }}><strong>Address:</strong> {address}</div>}
      {order.notes && <div style={{ fontSize: 12, color: "#4f3d5c" }}><strong>Notes:</strong> {order.notes}</div>}
      {order.paymentMethod && <div style={{ fontSize: 12, color: "#4f3d5c" }}><strong>Payment:</strong> {order.paymentMethod}</div>}

      <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px dashed rgba(148,122,173,0.5)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#3c274f" }}>Items {itemCount > 0 ? `(${itemCount})` : ""}</div>
        <div style={{ display: "grid", gap: 4 }}>
          {items.length === 0
            ? <div style={{ fontSize: 12, color: "#7a6989" }}>No item details available.</div>
            : items.map((it, idx) => {
                const name = it.productName || it.name || "Item";
                const qty = it.quantity || it.qty || 1;
                const price = it.unitPrice || it.price || 0;
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#4f3d5c" }}>
                    <span>{name} × {qty}</span>
                    <span>{formatMoney(price * qty)}</span>
                  </div>
                );
              })
          }
        </div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#3c274f" }}>
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return <th style={{ textAlign: align, padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#4a2a73", borderBottom: "1px solid rgba(148,122,173,0.25)" }}>{children}</th>;
}
function Td({ children, align = "left" }) {
  return <td style={{ textAlign: align, padding: "8px 10px", fontSize: 12, color: "#4f3d5c", borderBottom: "1px solid rgba(148,122,173,0.13)" }}>{children}</td>;
}
