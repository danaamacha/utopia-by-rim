// frontend/src/pages/admin/AdminCustomers.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

async function fetchAdminCustomers({ page = 1, limit = 50, search, sort = "desc" } = {}) {
  const token = getToken();
  const params = new URLSearchParams({ page, limit, sort });
  if (search?.trim()) params.set("search", search.trim());

  const res = await fetch(`${API_BASE}/admin/customers?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) throw new Error("Unauthorized — please log in again");
  if (res.status === 403) throw new Error("Forbidden — admin access required");
  if (!res.ok) throw new Error(`Server error (${res.status})`);

  const json = await res.json();
  return {
    data: Array.isArray(json) ? json : (json.data ?? []),
    total: json.total ?? 0,
    totalPages: json.totalPages ?? 1,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatMoney(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
    }).format(new Date(d));
  } catch {
    return String(d);
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminCustomers() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [customers, setCustomers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all"); // all | hasOrders | noOrders
  const [selectedId, setSelectedId] = useState(null);

  const loadCustomers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminCustomers({ search })
      .then(({ data, total }) => {
        setCustomers(data);
        setTotal(total);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Client-side filter by orders (data already fetched)
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (filter === "hasOrders") return c.totalOrders > 0;
      if (filter === "noOrders") return c.totalOrders === 0;
      return true;
    });
  }, [customers, filter]);

  const selectedCustomer = useMemo(
    () => filtered.find((c) => c.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 6,
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>Customers</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            View your customers, their contact details and order history.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            {loading
              ? "Loading…"
              : `Showing ${filtered.length} of ${total} customers`}
          </p>
        </div>

        <button
          onClick={loadCustomers}
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

      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : 220 }}>
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: isMobile ? "1 1 100%" : "0 0 220px", minWidth: isMobile ? "100%" : 160 }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              fontSize: 13,
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All customers</option>
            <option value="hasOrders">With orders</option>
            <option value="noOrders">No orders yet</option>
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#7a6989", fontSize: 13 }}>
          Loading customers…
        </div>
      )}

      {/* ERROR */}
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
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Failed to load customers</div>
          <div style={{ marginBottom: 12, color: "#c62828" }}>{error}</div>
          <button
            onClick={loadCustomers}
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
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {isMobile ? (
              <CustomerCardsMobile
                customers={filtered}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            ) : (
              <CustomerTableDesktop
                customers={filtered}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            )}
          </div>

          {!isMobile && <CustomerDetailsPanel customer={selectedCustomer} />}
        </div>
      )}

      {!loading && !error && isMobile && selectedCustomer && (
        <div style={{ marginTop: 10 }}>
          <CustomerDetailsPanel customer={selectedCustomer} />
        </div>
      )}
    </div>
  );
}

// ─── DESKTOP TABLE ────────────────────────────────────────────────────────────
function CustomerTableDesktop({ customers, selectedId, setSelectedId }) {
  if (customers.length === 0) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: "#7a6989", textAlign: "center" }}>
        No customers found.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead style={{ background: "#f5effb" }}>
        <tr>
          <Th>Customer</Th>
          <Th>Email</Th>
          <Th>Phone</Th>
          <Th align="right">Orders</Th>
          <Th align="right">Total spent</Th>
          <Th>Joined</Th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => {
          const active = c.id === selectedId;
          return (
            <tr
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                background: active ? "#f9f3ff" : "#fff",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <Td>
                <div style={{ fontWeight: 600, color: "#3c274f" }}>
                  {c.fullName || "—"}
                </div>
                {c.lastOrderAt && (
                  <div style={{ fontSize: 11, color: "#7a6989" }}>
                    Last order: {formatDate(c.lastOrderAt)}
                  </div>
                )}
              </Td>
              <Td>
                <span style={{ fontSize: 12, color: "#7a6989", wordBreak: "break-all" }}>
                  {c.email || "—"}
                </span>
              </Td>
              <Td>
                <span style={{ fontSize: 12, color: "#7a6989" }}>
                  {c.phone || "—"}
                </span>
              </Td>
              <Td align="right">
                <span style={{ fontWeight: 600, color: "#3c274f" }}>
                  {c.totalOrders ?? 0}
                </span>
              </Td>
              <Td align="right">
                <span style={{ fontWeight: 600, color: "#3c274f" }}>
                  {formatMoney(c.totalSpent)}
                </span>
              </Td>
              <Td>
                <span style={{ fontSize: 11, color: "#7a6989" }}>
                  {formatDate(c.createdAt)}
                </span>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── MOBILE CARDS ─────────────────────────────────────────────────────────────
function CustomerCardsMobile({ customers, selectedId, setSelectedId }) {
  if (customers.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No customers found.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10, padding: 10 }}>
      {customers.map((c) => {
        const active = c.id === selectedId;
        return (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            style={{
              borderRadius: 14,
              border: active
                ? "1px solid rgba(124,81,161,0.9)"
                : "1px solid rgba(148,122,173,0.4)",
              background: active ? "#f9f3ff" : "#fff",
              padding: 10,
              display: "grid",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#3c274f" }}>
              {c.fullName || "—"}
            </div>
            {c.email && (
              <div style={{ fontSize: 12, color: "#7a6989", wordBreak: "break-all" }}>
                {c.email}
              </div>
            )}
            {c.phone && (
              <div style={{ fontSize: 12, color: "#7a6989" }}>{c.phone}</div>
            )}
            <div style={{ fontSize: 11, color: "#7a6989" }}>
              Orders: <strong style={{ color: "#3c274f" }}>{c.totalOrders ?? 0}</strong>
              {" · "}
              Spent: <strong style={{ color: "#3c274f" }}>{formatMoney(c.totalSpent)}</strong>
            </div>
            {c.lastOrderAt && (
              <div style={{ fontSize: 11, color: "#7a6989" }}>
                Last order: {formatDate(c.lastOrderAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CUSTOMER DETAILS PANEL ───────────────────────────────────────────────────
function CustomerDetailsPanel({ customer }) {
  if (!customer) {
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
        Select a customer to view details.
      </div>
    );
  }

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
      {/* Name + role badge */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#3c274f" }}>
          {customer.fullName || "—"}
        </div>
        <span
          style={{
            marginTop: 4,
            display: "inline-flex",
            padding: "2px 8px",
            borderRadius: 999,
            background: customer.role === "admin"
              ? "rgba(244,67,54,0.12)"
              : "rgba(124,81,161,0.1)",
            fontSize: 10,
            color: customer.role === "admin" ? "#b71c1c" : "#4a2a73",
            fontWeight: 600,
          }}
        >
          {customer.role === "admin" ? "Admin" : "Customer"}
        </span>
      </div>

      {/* Contact */}
      <div style={{ display: "grid", gap: 4 }}>
        {customer.email && (
          <div style={{ fontSize: 12, color: "#4f3d5c" }}>
            <strong>Email:</strong> {customer.email}
          </div>
        )}
        {customer.phone && (
          <div style={{ fontSize: 12, color: "#4f3d5c" }}>
            <strong>Phone:</strong> {customer.phone}
          </div>
        )}
        <div style={{ fontSize: 12, color: "#4f3d5c" }}>
          <strong>Joined:</strong> {formatDate(customer.createdAt)}
        </div>
        <div style={{ fontSize: 12, color: "#4f3d5c" }}>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color: customer.isActive ? "#2e7d32" : "#b71c1c",
              fontWeight: 600,
            }}
          >
            {customer.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
        <StatPill label="Orders" value={customer.totalOrders ?? 0} />
        <StatPill label="Total spent" value={formatMoney(customer.totalSpent)} />
        {customer.lastOrderAt && (
          <StatPill label="Last order" value={formatDate(customer.lastOrderAt)} />
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: "#fff",
        border: "1px solid rgba(148,122,173,0.4)",
        fontSize: 12,
      }}
    >
      {label}: <strong style={{ color: "#3c274f" }}>{value}</strong>
    </div>
  );
}

// ─── TABLE ATOMS ──────────────────────────────────────────────────────────────
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