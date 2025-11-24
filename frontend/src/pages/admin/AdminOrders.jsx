// frontend/src/pages/admin/AdminOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const LS_ORDERS_KEY = "orders_v1";
const LS_LAST_ORDER_KEY = "last_order";

/* ------------ Helpers to read/write orders ------------ */

function readOrdersFromStorage() {
  // 1) Try main orders array
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }

  // 2) Fallback: single last_order (from checkout / confirmation)
  try {
    const raw = localStorage.getItem(LS_LAST_ORDER_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === "object") {
        return [
          {
            id: o.id || "ORDER-DEMO",
            createdAt: o.createdAt || o.date || new Date().toISOString(),
            status: o.status || "pending",
            total: o.total || o.grandTotal || 0,
            items: o.items || [],
            name: o.name || o.customerName || "Customer",
            email: o.email || "",
            phone: o.phone || "",
            address: o.address || o.shippingAddress || "",
            notes: o.notes || "",
          },
        ];
      }
    }
  } catch {
    /* ignore */
  }

  // 3) Seed demo orders if nothing found
  const demo = seedDemoOrders();
  writeOrdersToStorage(demo);
  return demo;
}

function writeOrdersToStorage(arr) {
  try {
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function seedDemoOrders() {
  const now = Date.now();
  return [
    {
      id: "UTP-1A2B3C",
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      status: "pending",
      total: 95,
      name: "Sara Haddad",
      email: "sara@example.com",
      phone: "+961 70 000 001",
      address: "Beirut, Lebanon",
      notes: "Gift wrapping please.",
      items: [
        { id: "p1", name: "Agate Clock", qty: 1, price: 56 },
        { id: "p3", name: "Forest Coasters", qty: 1, price: 39 },
      ],
    },
    {
      id: "UTP-4D5E6F",
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      status: "shipped",
      total: 420,
      name: "Nour Itani",
      email: "nour@example.com",
      phone: "+961 70 000 002",
      address: "Tripoli, Lebanon",
      notes: "",
      items: [{ id: "p2", name: "Ocean Table", qty: 1, price: 420 }],
    },
    {
      id: "UTP-7G8H9I",
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      status: "delivered",
      total: 84,
      name: "Maya Chami",
      email: "maya@example.com",
      phone: "+961 70 000 003",
      address: "Saida, Lebanon",
      notes: "",
      items: [{ id: "p4", name: "Marble Coasters", qty: 2, price: 42 }],
    },
  ];
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toFixed(2)}`;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

function getStatusConfig(status) {
  const map = {
    pending: {
      label: "Pending",
      bg: "rgba(255, 193, 7, 0.15)",
      color: "#795548",
    },
    paid: {
      label: "Paid",
      bg: "rgba(33, 150, 243, 0.15)",
      color: "#1565c0",
    },
    shipped: {
      label: "Shipped",
      bg: "rgba(3, 169, 244, 0.15)",
      color: "#0277bd",
    },
    delivered: {
      label: "Delivered",
      bg: "rgba(76, 175, 80, 0.15)",
      color: "#2e7d32",
    },
    cancelled: {
      label: "Cancelled",
      bg: "rgba(244, 67, 54, 0.15)",
      color: "#b71c1c",
    },
  };
  return map[status] || map.pending;
}

/* ------------ Component ------------ */

export default function AdminOrders() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const data = readOrdersFromStorage();
    // newest first
    data.sort((a, b) => {
      const ta = +new Date(a.createdAt || a.date || 0);
      const tb = +new Date(b.createdAt || b.date || 0);
      return tb - ta;
    });
    setOrders(data);
    if (data.length > 0) setSelectedId(data[0].id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const textMatch =
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q));

      const status = (o.status || "pending").toLowerCase();
      const statusMatch =
        statusFilter === "all" || status === statusFilter;

      return textMatch && statusMatch;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = useMemo(
    () => filtered.find((o) => o.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const updateStatus = (id, newStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, status: newStatus } : o
      );
      writeOrdersToStorage(next);
      return next;
    });
  };

  const totalCount = orders.length;

  return (
    <div
      style={{
        padding: isMobile ? 8 : 12,
      }}
    >
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
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 18 : 20,
              color: "#3c274f",
            }}
          >
            Orders
          </h1>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#7a6989",
            }}
          >
            Track customer orders, update statuses and review details.
          </p>
          <p
            style={{
              marginTop: 2,
              fontSize: 11,
              color: "#a38fb5",
            }}
          >
            Showing {filtered.length} of {totalCount} orders.
          </p>
        </div>
      </header>

      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: isMobile ? "1 1 100%" : "1 1 260px",
            minWidth: isMobile ? 0 : 200,
          }}
        >
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

        {/* Status filter */}
        <div
          style={{
            flex: isMobile ? "1 1 100%" : "0 0 200px",
            minWidth: isMobile ? 0 : 160,
          }}
        >
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

        <div style={{ flex: 1 }} />
      </div>

      {/* LAYOUT: list + details (desktop) OR just list (mobile) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: TABLE / LIST */}
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
            />
          ) : (
            <OrderTableDesktop
              orders={filtered}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              updateStatus={updateStatus}
            />
          )}
        </div>

        {/* RIGHT: DETAILS (desktop only) */}
        {!isMobile && <OrderDetailsPanel order={selectedOrder} />}
      </div>

      {/* On mobile, show details below list */}
      {isMobile && selectedOrder && (
        <div style={{ marginTop: 14 }}>
          <OrderDetailsPanel order={selectedOrder} />
        </div>
      )}
    </div>
  );
}

/* ------------ Desktop table ------------ */

function OrderTableDesktop({
  orders,
  selectedId,
  setSelectedId,
  updateStatus,
}) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No orders yet. When customers checkout, they will appear here.
      </div>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
      }}
    >
      <thead style={{ background: "#f5effb" }}>
        <tr>
          <Th>ID</Th>
          <Th>Customer</Th>
          <Th>Date</Th>
          <Th align="right">Total</Th>
          <Th>Status</Th>
          <Th align="right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const active = o.id === selectedId;
          const cfg = getStatusConfig(o.status || "pending");

          return (
            <tr
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              style={{
                background: active ? "#f9f3ff" : "#fff",
                cursor: "pointer",
              }}
            >
              <Td>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#4a2a73",
                  }}
                >
                  {o.id}
                </div>
              </Td>
              <Td>
                <div style={{ fontWeight: 600, color: "#3c274f" }}>
                  {o.name || "—"}
                </div>
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
              <Td>{formatDate(o.createdAt || o.date)}</Td>
              <Td align="right">{formatMoney(o.total)}</Td>
              <Td>
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
                  }}
                >
                  {cfg.label}
                </span>
              </Td>
              <Td align="right">
                <select
                  value={(o.status || "pending").toLowerCase()}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 11,
                    padding: "5px 7px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,122,173,0.6)",
                    backgroundColor: "#fff",
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {getStatusConfig(s).label}
                    </option>
                  ))}
                </select>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------ Mobile cards ------------ */

function OrderCardsMobile({
  orders,
  selectedId,
  setSelectedId,
  updateStatus,
}) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No orders yet. When customers checkout, they will appear here.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: 10,
      }}
    >
      {orders.map((o) => {
        const active = o.id === selectedId;
        const cfg = getStatusConfig(o.status || "pending");
        const itemCount = (o.items || []).reduce(
          (s, it) => s + (it.qty || 1),
          0
        );

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#4a2a73",
                  }}
                >
                  {o.id}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#7a6989",
                  }}
                >
                  {formatDate(o.createdAt || o.date)}
                </div>
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "3px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: cfg.bg,
                  color: cfg.color,
                }}
              >
                {cfg.label}
              </span>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {o.name || "—"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#7a6989",
                marginBottom: 2,
              }}
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
              {formatMoney(o.total)}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
              }}
            >
              <select
                value={(o.status || "pending").toLowerCase()}
                onChange={(e) => {
                  e.stopPropagation();
                  updateStatus(o.id, e.target.value);
                }}
                style={{
                  fontSize: 11,
                  padding: "5px 7px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,122,173,0.6)",
                  backgroundColor: "#fff",
                  flex: 1,
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {getStatusConfig(s).label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(o.id);
                  // details will show below on mobile
                }}
                style={{
                  fontSize: 11,
                  padding: "5px 9px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(90deg,#7c51a1,#4a2a73)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                View
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------ Shared table cells ------------ */

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
      }}
    >
      {children}
    </td>
  );
}

/* ------------ Order details panel ------------ */

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

  const items = order.items || [];
  const itemCount = items.reduce((s, it) => s + (it.qty || 1), 0);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(148,122,173,0.25)",
        padding: 14,
        background: "#faf6ff",
        display: "grid",
        gap: 8,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "#4a2a73",
          }}
        >
          {order.id}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#7a6989",
            marginTop: 2,
          }}
        >
          {formatDate(order.createdAt || order.date)}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {order.name || "—"}
        </div>
        <div style={{ fontSize: 12, color: "#7a6989" }}>
          {order.email || "—"}
        </div>
        {order.phone && (
          <div style={{ fontSize: 12, color: "#7a6989" }}>
            {order.phone}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#4f3d5c" }}>
        <strong>Address:</strong> {order.address || "—"}
      </div>

      {order.notes && (
        <div style={{ fontSize: 12, color: "#4f3d5c" }}>
          <strong>Notes:</strong> {order.notes}
        </div>
      )}

      <div
        style={{
          marginTop: 4,
          paddingTop: 6,
          borderTop: "1px dashed rgba(148,122,173,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 4,
            color: "#3c274f",
          }}
        >
          Items ({itemCount})
        </div>
        <div
          style={{
            display: "grid",
            gap: 4,
          }}
        >
          {items.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#7a6989",
              }}
            >
              No item details available.
            </div>
          )}
          {items.map((it, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#4f3d5c",
              }}
            >
              <span>
                {it.name || "Item"} × {it.qty || 1}
              </span>
              <span>
                {formatMoney((it.price || 0) * (it.qty || 1))}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 6,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: 700,
            color: "#3c274f",
          }}
        >
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
