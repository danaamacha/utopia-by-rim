// frontend/src/pages/admin/AdminOrders.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const getToken = () => localStorage.getItem("auth_token") || "";

async function fetchAdminOrders({ page = 1, limit = 50, status, search } = {}) {
  const token = getToken();
  const params = new URLSearchParams({ page, limit, sort: "desc" });
  if (status && status !== "all") params.set("status", status);
  if (search?.trim()) params.set("search", search.trim());

  const res = await fetch(`${API_BASE}/admin/orders?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) throw new Error("Unauthorized — please log in again");
  if (res.status === 403) throw new Error("Forbidden — admin access required");
  if (!res.ok) throw new Error(`Server error (${res.status})`);

  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

async function updateOrderStatus(orderId, status, note = "") {
  const token = getToken();
  const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update status (${res.status})`);
  }
  return res.json();
}

// ─── NEW: update payment status ───────────────────────────────────────────────
async function updatePaymentStatus(orderId, paymentStatus) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update payment status (${res.status})`);
  }
  return res.json();
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────
function normalizeOrder(o) {
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status ?? "pending",
    paymentStatus: o.paymentStatus ?? "unpaid",
    paymentMethod: o.paymentMethod ?? "COD",
    total: Number(o.total ?? 0),
    subtotal: Number(o.subtotal ?? 0),
    currency: o.currency ?? "USD",
    name: o.fullName ?? o.email ?? "Customer",
    email: o.email ?? "",
    phone: o.phone ?? "",
    address: [o.addressLine1, o.addressLine2, o.city, o.state, o.country]
      .filter(Boolean)
      .join(", "),
    postalCode: o.postalCode ?? "",
    items: (o.items ?? []).map((i) => ({
      id: i.id,
      name: i.productName ?? "Product",
      qty: Number(i.quantity ?? 1),
      price: Number(i.unitPrice ?? 0),
      lineTotal: Number(i.lineTotal ?? 0),
    })),
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatMoney(n, currency = "USD") {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(v);
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return String(d);
  }
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS = ["unpaid", "paid", "failed", "refunded"];

function getStatusConfig(status) {
  const map = {
    pending:    { label: "Pending",    bg: "rgba(255,193,7,0.15)",   color: "#795548" },
    confirmed:  { label: "Confirmed",  bg: "rgba(33,150,243,0.12)",  color: "#1565c0" },
    processing: { label: "Processing", bg: "rgba(156,39,176,0.12)",  color: "#6a1b9a" },
    shipped:    { label: "Shipped",    bg: "rgba(3,169,244,0.15)",   color: "#0277bd" },
    delivered:  { label: "Delivered",  bg: "rgba(76,175,80,0.15)",   color: "#2e7d32" },
    cancelled:  { label: "Cancelled",  bg: "rgba(244,67,54,0.15)",   color: "#b71c1c" },
  };
  return map[status] || map.pending;
}

function getPaymentStatusConfig(status) {
  const map = {
    unpaid:   { label: "Unpaid",    bg: "rgba(255,152,0,0.15)",  color: "#e65100" },
    paid:     { label: "Paid",      bg: "rgba(76,175,80,0.15)",  color: "#2e7d32" },
    failed:   { label: "Failed",    bg: "rgba(244,67,54,0.15)",  color: "#b71c1c" },
    refunded: { label: "Refunded",  bg: "rgba(96,125,139,0.15)", color: "#37474f" },
  };
  return map[status] || map.unpaid;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminOrders() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId]     = useState(null);
  const [statusError, setStatusError]   = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminOrders({ search, status: statusFilter })
      .then((raw) => {
        const normalized = raw.map(normalizeOrder);
        normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(normalized);
        if (normalized.length > 0 && !selectedId) {
          setSelectedId(normalized[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = useCallback(async (id, newStatus) => {
    setStatusError(null);
    try {
      await updateOrderStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      setStatusError(err.message);
    }
  }, []);

  // ─── NEW: update payment status handler ──────────────────────────────────
  const updatePayStatus = useCallback(async (id, newPaymentStatus) => {
    setStatusError(null);
    try {
      await updatePaymentStatus(id, newPaymentStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, paymentStatus: newPaymentStatus } : o
        )
      );
    } catch (err) {
      setStatusError(err.message);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const textMatch =
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      const statusMatch =
        statusFilter === "all" || o.status === statusFilter;
      return textMatch && statusMatch;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = useMemo(
    () => filtered.find((o) => o.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  return (
    <div style={{ padding: isMobile ? 8 : 12 }}>

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>
            Orders
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            Track customer orders, update statuses and review details.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            {loading
              ? "Loading…"
              : `Showing ${filtered.length} of ${orders.length} orders`}
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          style={{
            padding: "7px 16px",
            borderRadius: 999,
            border: "1px solid rgba(124,81,161,0.5)",
            background: "transparent",
            color: "#4a2a73",
            fontSize: 12,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </header>

      {/* STATUS UPDATE ERROR TOAST */}
      {statusError && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(244,67,54,0.1)",
            border: "1px solid rgba(244,67,54,0.4)",
            color: "#b71c1c",
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠ {statusError}</span>
          <button
            onClick={() => setStatusError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#b71c1c",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: isMobile ? "1 1 100%" : "1 1 260px", minWidth: isMobile ? 0 : 200 }}>
          <input
            type="text"
            placeholder="Search by order ID, name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "9px 10px" : "9px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              fontSize: isMobile ? 12 : 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: isMobile ? "1 1 100%" : "0 0 200px", minWidth: isMobile ? 0 : 160 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "9px 10px" : "9px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              fontSize: isMobile ? 12 : 13,
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {getStatusConfig(s).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#7a6989", fontSize: 13 }}>
          Loading orders…
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div
          style={{
            padding: "24px 16px",
            borderRadius: 12,
            border: "1px solid rgba(244,67,54,0.3)",
            background: "rgba(244,67,54,0.06)",
            color: "#b71c1c",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Failed to load orders</div>
          <div style={{ marginBottom: 12, color: "#c62828" }}>{error}</div>
          <button
            onClick={loadOrders}
            style={{
              padding: "7px 18px",
              borderRadius: 999,
              border: "none",
              background: "#b71c1c",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              overflow: "hidden",
            }}
          >
            {isMobile ? (
              <OrderCardsMobile
                orders={filtered}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                updateStatus={updateStatus}
                updatePayStatus={updatePayStatus}
              />
            ) : (
              <OrderTableDesktop
                orders={filtered}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                updateStatus={updateStatus}
                updatePayStatus={updatePayStatus}
              />
            )}
          </div>

          {!isMobile && <OrderDetailsPanel order={selectedOrder} />}
        </div>
      )}

      {!loading && !error && isMobile && selectedOrder && (
        <div style={{ marginTop: 14 }}>
          <OrderDetailsPanel order={selectedOrder} />
        </div>
      )}
    </div>
  );
}

// ─── DESKTOP TABLE ────────────────────────────────────────────────────────────
function OrderTableDesktop({ orders, selectedId, setSelectedId, updateStatus, updatePayStatus }) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: "#7a6989", textAlign: "center" }}>
        No orders found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead style={{ background: "#f5effb" }}>
          <tr>
            <Th>ID</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th align="right">Total</Th>
            <Th>Order Status</Th>
            <Th>Payment</Th>
            <Th align="center">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const active = o.id === selectedId;
            return (
              <tr
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{
                  background: active ? "#f9f3ff" : "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <Td>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73" }}>
                    {String(o.id).slice(0, 8)}…
                  </div>
                </Td>
                <Td>
                  <div style={{ fontWeight: 600, color: "#3c274f" }}>{o.name || "—"}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a6989",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 160,
                    }}
                  >
                    {o.email || "—"}
                  </div>
                </Td>
                <Td>{formatDate(o.createdAt)}</Td>
                <Td align="right">{formatMoney(o.total, o.currency)}</Td>

                {/* Order status badge + dropdown */}
                <Td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <StatusBadge status={o.status} />
                    <StatusSelect
                      value={o.status}
                      onChange={(val) => updateStatus(o.id, val)}
                    />
                  </div>
                </Td>

                {/* Payment status badge + dropdown */}
                <Td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <PaymentStatusSelect
                      value={o.paymentStatus}
                      onChange={(val) => updatePayStatus(o.id, val)}
                    />
                  </div>
                </Td>

                <Td align="center">
                  <span style={{ fontSize: 11, color: "#7a6989" }}>
                    {o.paymentMethod}
                  </span>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── MOBILE CARDS ─────────────────────────────────────────────────────────────
function OrderCardsMobile({ orders, selectedId, setSelectedId, updateStatus, updatePayStatus }) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No orders found.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10, padding: 10 }}>
      {orders.map((o) => {
        const active = o.id === selectedId;
        const itemCount = o.items.reduce((s, it) => s + it.qty, 0);

        return (
          <div
            key={o.id}
            onClick={() => setSelectedId(o.id)}
            style={{
              borderRadius: 14,
              border: active
                ? "1px solid rgba(124,81,161,0.9)"
                : "1px solid rgba(148,122,173,0.4)",
              background: active ? "#f9f3ff" : "#fff",
              padding: 10,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73" }}>
                  {String(o.id).slice(0, 8)}…
                </div>
                <div style={{ fontSize: 11, color: "#7a6989" }}>
                  {formatDate(o.createdAt)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                <StatusBadge status={o.status} />
                <PaymentStatusBadge status={o.paymentStatus} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#3c274f" }}>
              {o.name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "#7a6989" }}>
              {itemCount} item{itemCount !== 1 ? "s" : ""} · {formatMoney(o.total, o.currency)}
            </div>

            {/* Order status update */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#7a6989", minWidth: 70 }}>Order:</span>
              <StatusSelect
                value={o.status}
                onChange={(val) => updateStatus(o.id, val)}
                style={{ flex: 1 }}
              />
            </div>

            {/* Payment status update */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#7a6989", minWidth: 70 }}>Payment:</span>
              <PaymentStatusSelect
                value={o.paymentStatus}
                onChange={(val) => updatePayStatus(o.id, val)}
                style={{ flex: 1 }}
              />
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}
              style={{
                fontSize: 11,
                padding: "5px 9px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(90deg,#7c51a1,#4a2a73)",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Details
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── ORDER DETAILS PANEL ──────────────────────────────────────────────────────
function OrderDetailsPanel({ order }) {
  if (!order) {
    return (
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148,122,173,0.25)",
          padding: 14,
          background: "#faf6ff",
          fontSize: 13,
          color: "#7a6989",
        }}
      >
        Select an order to view details.
      </div>
    );
  }

  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(148,122,173,0.25)",
        padding: 14,
        background: "#faf6ff",
        display: "grid",
        gap: 10,
      }}
    >
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a2a73", wordBreak: "break-all" }}>
          {order.id}
        </div>
        <div style={{ fontSize: 11, color: "#7a6989", marginTop: 2 }}>
          {formatDate(order.createdAt)}
        </div>
      </div>

      {/* Status badges row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <span
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(148,122,173,0.12)",
            color: "#4a2a73",
            fontWeight: 600,
          }}
        >
          {order.paymentMethod}
        </span>
      </div>

      <div style={{ borderTop: "1px dashed rgba(148,122,173,0.4)", paddingTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3c274f", marginBottom: 2 }}>
          {order.name || "—"}
        </div>
        {order.email && (
          <div style={{ fontSize: 12, color: "#7a6989" }}>{order.email}</div>
        )}
        {order.phone && (
          <div style={{ fontSize: 12, color: "#7a6989" }}>{order.phone}</div>
        )}
      </div>

      {order.address && (
        <div style={{ fontSize: 12, color: "#4f3d5c" }}>
          <strong>Address:</strong> {order.address}
          {order.postalCode ? ` ${order.postalCode}` : ""}
        </div>
      )}

      <div style={{ borderTop: "1px dashed rgba(148,122,173,0.4)", paddingTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#3c274f" }}>
          Items ({itemCount})
        </div>

        {order.items.length === 0 ? (
          <div style={{ fontSize: 12, color: "#7a6989" }}>No item details.</div>
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            {order.items.map((it, idx) => (
              <div
                key={it.id || idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#4f3d5c",
                }}
              >
                <span>{it.name} × {it.qty}</span>
                <span>{formatMoney(it.lineTotal || it.price * it.qty)}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: "1px solid rgba(148,122,173,0.2)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: 700,
            color: "#3c274f",
          }}
        >
          <span>Total</span>
          <span>{formatMoney(order.total, order.currency)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const cfg = getPaymentStatusConfig(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatusSelect({ value, onChange, style: extraStyle = {} }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: 11,
        padding: "5px 7px",
        borderRadius: 999,
        border: "1px solid rgba(148,122,173,0.6)",
        backgroundColor: "#fff",
        cursor: "pointer",
        ...extraStyle,
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {getStatusConfig(s).label}
        </option>
      ))}
    </select>
  );
}

function PaymentStatusSelect({ value, onChange, style: extraStyle = {} }) {
  const cfg = getPaymentStatusConfig(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: 11,
        padding: "5px 7px",
        borderRadius: 999,
        border: `1px solid ${cfg.color}55`,
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        cursor: "pointer",
        ...extraStyle,
      }}
    >
      {PAYMENT_STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {getPaymentStatusConfig(s).label}
        </option>
      ))}
    </select>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "8px 10px",
        fontWeight: 600,
        fontSize: 12,
        color: "#4a2a73",
        borderBottom: "1px solid rgba(148,122,173,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }) {
  return (
    <td
      style={{
        textAlign: align,
        padding: "8px 10px",
        fontSize: 12,
        color: "#4f3d5c",
        borderBottom: "1px solid rgba(148,122,173,0.13)",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}