// frontend/src/pages/admin/AdminCustomers.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const LS_USERS_KEY = "users_db";        // from AuthContext
const LS_ORDERS_KEY = "orders_v1";      // main orders array
const LS_LAST_ORDER_KEY = "last_order"; // fallback single order

/* ---------- Helpers: read users & orders ---------- */

function readUsersDb() {
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
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
      items: [
        { id: "p4", name: "Marble Coasters", qty: 2, price: 42 },
      ],
    },
  ];
}

function writeOrdersToStorage(arr) {
  try {
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function readOrders() {
  // 1) main array
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {
    /* ignore */
  }

  // 2) fallback last_order
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

  // 3) seed demo if nothing
  const demo = seedDemoOrders();
  writeOrdersToStorage(demo);
  return demo;
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

/* ---------- Build customers list ---------- */
/**
 * Each customer:
 * {
 *   key: string,
 *   id: string | null,
 *   name: string,
 *   email: string,
 *   phone: string,
 *   totalOrders: number,
 *   totalSpent: number,
 *   lastOrderAt: string | null,
 *   fromUserDb: boolean,
 * }
 */
function buildCustomers(users, orders) {
  const map = new Map();

  const upsert = ({ id, name, email, phone, fromUserDb, order }) => {
    const emailKey = (email || "").toLowerCase().trim();
    const key = emailKey || id || phone || name || Math.random().toString(36);

    let c = map.get(key);
    if (!c) {
      c = {
        key,
        id: id || null,
        name: name || "—",
        email: email || "",
        phone: phone || "",
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        fromUserDb: !!fromUserDb,
      };
    } else {
      c.name = c.name === "—" && name ? name : c.name;
      c.email = c.email || email || "";
      c.phone = c.phone || phone || "";
      if (id && !c.id) c.id = id;
      if (fromUserDb) c.fromUserDb = true;
    }

    if (order) {
      c.totalOrders += 1;
      c.totalSpent += Number(order.total || 0);
      const currentTs = c.lastOrderAt ? +new Date(c.lastOrderAt) : 0;
      const newTs = +new Date(order.createdAt || order.date || 0);
      if (!c.lastOrderAt || newTs > currentTs) {
        c.lastOrderAt = order.createdAt || order.date;
      }
    }

    map.set(key, c);
  };

  users.forEach((u) => {
    upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      fromUserDb: true,
      order: null,
    });
  });

  orders.forEach((o) => {
    upsert({
      id: null,
      name: o.name,
      email: o.email,
      phone: o.phone,
      fromUserDb: false,
      order: o,
    });
  });

  const arr = Array.from(map.values());

  arr.sort((a, b) => {
    if (a.totalOrders > 0 && b.totalOrders === 0) return -1;
    if (a.totalOrders === 0 && b.totalOrders > 0) return 1;
    const ta = a.lastOrderAt ? +new Date(a.lastOrderAt) : 0;
    const tb = b.lastOrderAt ? +new Date(b.lastOrderAt) : 0;
    if (tb !== ta) return tb - ta;
    return (a.name || "").localeCompare(b.name || "");
  });

  return arr;
}

/* ---------- Main component ---------- */

export default function AdminCustomers() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | hasOrders | noOrders
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const users = readUsersDb();
    const ords = readOrders();
    setOrders(ords);
    const custs = buildCustomers(users, ords);
    setCustomers(custs);
    if (custs.length > 0) {
      setSelectedKey(custs[0].key);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const inSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q));

      let inFilter = true;
      if (filter === "hasOrders") inFilter = c.totalOrders > 0;
      if (filter === "noOrders") inFilter = c.totalOrders === 0;

      return inSearch && inFilter;
    });
  }, [customers, search, filter]);

  const selectedCustomer = useMemo(
    () => filtered.find((c) => c.key === selectedKey) || filtered[0] || null,
    [filtered, selectedKey]
  );

  const totalCount = customers.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
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
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>
            Customers
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            View your customers, their contact details and order history.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            Showing {filtered.length} of {totalCount} customers.
          </p>
        </div>
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
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : 220,
          }}
        >
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

        {/* Filter by orders */}
        <div
          style={{
            flex: isMobile ? "1 1 100%" : "0 0 220px",
            minWidth: isMobile ? "100%" : 160,
          }}
        >
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

        {/* Spacer hidden on mobile */}
        {!isMobile && <div style={{ flex: 1 }} />}
      </div>

      {/* LAYOUT: list + details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: table / cards */}
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
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          ) : (
            <CustomerTableDesktop
              customers={filtered}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          )}
        </div>

        {/* RIGHT: details (desktop) */}
        {!isMobile && (
          <CustomerDetailsPanel
            customer={selectedCustomer}
            orders={orders}
          />
        )}
      </div>

      {/* On mobile, show details below list */}
      {isMobile && selectedCustomer && (
        <div style={{ marginTop: 10 }}>
          <CustomerDetailsPanel
            customer={selectedCustomer}
            orders={orders}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Desktop table ---------- */

function CustomerTableDesktop({ customers, selectedKey, setSelectedKey }) {
  if (customers.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No customers yet. When users register or place orders,
        they will appear here.
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
          <Th>Customer</Th>
          <Th>Email</Th>
          <Th>Phone</Th>
          <Th align="right">Orders</Th>
          <Th align="right">Total spent</Th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => {
          const active = c.key === selectedKey;
          return (
            <tr
              key={c.key}
              onClick={() => setSelectedKey(c.key)}
              style={{
                background: active ? "#f9f3ff" : "#fff",
                cursor: "pointer",
              }}
            >
              <Td>
                <div style={{ fontWeight: 600, color: "#3c274f" }}>
                  {c.name || "—"}
                </div>
                {c.lastOrderAt && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a6989",
                    }}
                  >
                    Last order: {formatDate(c.lastOrderAt)}
                  </div>
                )}
              </Td>
              <Td>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7a6989",
                    wordBreak: "break-all",
                  }}
                >
                  {c.email || "—"}
                </span>
              </Td>
              <Td>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7a6989",
                  }}
                >
                  {c.phone || "—"}
                </span>
              </Td>
              <Td align="right">
                <span
                  style={{
                    fontWeight: 600,
                    color: "#3c274f",
                  }}
                >
                  {c.totalOrders}
                </span>
              </Td>
              <Td align="right">
                <span
                  style={{
                    fontWeight: 600,
                    color: "#3c274f",
                  }}
                >
                  {formatMoney(c.totalSpent)}
                </span>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ---------- Mobile cards ---------- */

function CustomerCardsMobile({
  customers,
  selectedKey,
  setSelectedKey,
}) {
  if (customers.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
        No customers yet. When users register or place orders,
        they will appear here.
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
      {customers.map((c) => {
        const active = c.key === selectedKey;
        return (
          <div
            key={c.key}
            onClick={() => setSelectedKey(c.key)}
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
                fontSize: 13,
                fontWeight: 600,
                color: "#3c274f",
              }}
            >
              {c.name || "—"}
            </div>
            {c.email && (
              <div
                style={{
                  fontSize: 12,
                  color: "#7a6989",
                  wordBreak: "break-all",
                }}
              >
                {c.email}
              </div>
            )}
            {c.phone && (
              <div
                style={{
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                {c.phone}
              </div>
            )}
            <div
              style={{
                fontSize: 11,
                color: "#7a6989",
              }}
            >
              Orders:{" "}
              <strong style={{ color: "#3c274f" }}>
                {c.totalOrders}
              </strong>{" "}
              · Spent:{" "}
              <strong style={{ color: "#3c274f" }}>
                {formatMoney(c.totalSpent)}
              </strong>
            </div>
            {c.lastOrderAt && (
              <div
                style={{
                  fontSize: 11,
                  color: "#7a6989",
                }}
              >
                Last order: {formatDate(c.lastOrderAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Shared table cells ---------- */

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

/* ---------- Customer details panel ---------- */

function CustomerDetailsPanel({ customer, orders }) {
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

  const emailKey = (customer.email || "").toLowerCase().trim();
  const relatedOrders = (orders || []).filter((o) => {
    const e = (o.email || "").toLowerCase().trim();
    if (emailKey && e === emailKey) return true;
    if (!emailKey && customer.name && o.name) {
      return (
        customer.name.toLowerCase().trim() ===
        o.name.toLowerCase().trim()
      );
    }
    return false;
  });

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
            fontSize: 14,
            fontWeight: 700,
            color: "#3c274f",
          }}
        >
          {customer.name || "—"}
        </div>
        {customer.fromUserDb && (
          <span
            style={{
              marginTop: 2,
              display: "inline-flex",
              padding: "2px 6px",
              borderRadius: 999,
              background: "rgba(124,81,161,0.1)",
              fontSize: 10,
              color: "#4a2a73",
              fontWeight: 600,
            }}
          >
            Registered user
          </span>
        )}
      </div>

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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 6,
          fontSize: 12,
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "#fff",
            border: "1px solid rgba(148,122,173,0.4)",
          }}
        >
          Orders:{" "}
          <strong style={{ color: "#3c274f" }}>
            {customer.totalOrders}
          </strong>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "#fff",
            border: "1px solid rgba(148,122,173,0.4)",
          }}
        >
          Total spent:{" "}
          <strong style={{ color: "#3c274f" }}>
            {formatMoney(customer.totalSpent)}
          </strong>
        </div>
        {customer.lastOrderAt && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid rgba(148,122,173,0.4)",
            }}
          >
            Last order:{" "}
            <strong style={{ color: "#3c274f" }}>
              {formatDate(customer.lastOrderAt)}
            </strong>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
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
          Recent orders ({relatedOrders.length})
        </div>
        {relatedOrders.length === 0 && (
          <div style={{ fontSize: 12, color: "#7a6989" }}>
            No orders linked to this customer yet.
          </div>
        )}
        <div
          style={{
            display: "grid",
            gap: 4,
          }}
        >
          {relatedOrders.map((o) => (
            <div
              key={o.id}
              style={{
                fontSize: 12,
                color: "#4f3d5c",
                padding: "4px 0",
                borderBottom:
                  "1px dashed rgba(148,122,173,0.25)",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
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
                {formatDate(o.createdAt || o.date)} ·{" "}
                {formatMoney(o.total)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
