// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import { colors } from "../../theme";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "pages", label: "Pages" },
  { id: "discounts", label: "Discount Codes" },
  { id: "settings", label: "Settings" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  // demo stats (until real backend)
  const stats = useMemo(
    () => ({
      todayOrders: 5,
      todaySales: 245.75,
      openOrders: 8,
      lowStock: 3,
    }),
    []
  );

  const wrapperStyle = {
    minHeight: "80vh",
    padding: isMobile ? "84px 14px 30px" : "96px 24px 40px",
    background: "#f3edf7",
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
  };

  const navButtonBase = (active) => ({
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
  });

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

  return (
    <main style={wrapperStyle}>
      <div style={layoutStyle}>
        {/* =============== SIDEBAR =============== */}
        <aside style={sidebarCard}>
          {/* logo / admin label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
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

          {/* quick link to shop */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              textDecoration: "none",
              color: "#6d5a7a",
              marginBottom: 14,
            }}
          >
            <span>👀 View website</span>
          </Link>

          {/* separator */}
          <div
            style={{
              height: 1,
              background: "rgba(180,153,201,0.4)",
              margin: "6px 0 10px",
            }}
          />

          {/* nav */}
          <nav style={{ display: "grid", gap: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={navButtonBase(activeTab === t.id)}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: activeTab === t.id ? "#7c51a1" : "#e5d7f1",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: activeTab === t.id ? "#fff" : "#6b4b8c",
                  }}
                >
                  {t.label.charAt(0)}
                </span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* =============== MAIN CONTENT =============== */}
        <section
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: isMobile ? 14 : 20,
            boxShadow: "0 10px 26px rgba(0,0,0,.05)",
            border: "1px solid rgba(148,122,173,0.18)",
          }}
        >
          {activeTab === "dashboard" && <DashboardTab stats={stats} />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "customers" && <CustomersTab />}
          {activeTab === "pages" && <PagesTab />}
          {activeTab === "discounts" && <DiscountsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </section>
      </div>
    </main>
  );
}

/* =============== TAB COMPONENTS =============== */

function DashboardTab({ stats }) {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const gridStats = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))",
    gap: 12,
    marginTop: 14,
  };

  const cardStyle = {
    borderRadius: 14,
    padding: 14,
    background: "linear-gradient(135deg, #f9f4ff, #f3e7ff)",
    border: "1px solid rgba(148,122,173,0.35)",
    minHeight: 90,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const sub = { fontSize: 12, color: "#7a6989" };
  const value = { fontSize: 20, fontWeight: 800, color: "#4a2a73" };

  return (
    <>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              color: "#3c274f",
            }}
          >
            Dashboard overview
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7a6989" }}>
            Quick snapshot of today’s performance for Utopia by Rim.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={{
              padding: "7px 11px",
              borderRadius: 999,
              border: "1px solid rgba(148,122,173,0.5)",
              background: "#fff",
              fontSize: 12,
              cursor: "pointer",
              color: "#4a2a73",
            }}
          >
            Today
          </button>
          <button
            type="button"
            style={{
              padding: "7px 11px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(90deg, #7c51a1, #4a2a73)",
              fontSize: 12,
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            + New product
          </button>
        </div>
      </header>

      {/* Stats cards */}
      <div style={gridStats}>
        <div style={cardStyle}>
          <div style={sub}>Today’s Orders</div>
          <div style={value}>{stats.todayOrders}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>vs yesterday: +2</span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Today’s Sales</div>
          <div style={value}>${stats.todaySales.toFixed(2)}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>Approx. 3 items per order</span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Open Orders</div>
          <div style={value}>{stats.openOrders}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>
            Pending / preparing
          </span>
        </div>
        <div style={cardStyle}>
          <div style={sub}>Low Stock Items</div>
          <div style={value}>{stats.lowStock}</div>
          <span style={{ fontSize: 11, color: "#9b88ac" }}>
            Check stock before weekend
          </span>
        </div>
      </div>

      {/* Recent orders */}
      <section style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              color: "#3c274f",
            }}
          >
            Recent orders
          </h2>
          <Link
            to="/admin" // later you can change to /admin/orders route
            style={{
              fontSize: 12,
              color: "#4a2a73",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
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
              <Tr>
                <Td>#UTP-1042</Td>
                <Td>Nov 16, 2025</Td>
                <Td>Maya A.</Td>
                <Td align="right">$89.50</Td>
                <StatusTd status="pending">Pending</StatusTd>
              </Tr>
              <Tr>
                <Td>#UTP-1041</Td>
                <Td>Nov 16, 2025</Td>
                <Td>Sara K.</Td>
                <Td align="right">$45.00</Td>
                <StatusTd status="shipped">Shipped</StatusTd>
              </Tr>
              <Tr>
                <Td>#UTP-1040</Td>
                <Td>Nov 15, 2025</Td>
                <Td>Lea R.</Td>
                <Td align="right">$120.20</Td>
                <StatusTd status="delivered">Delivered</StatusTd>
              </Tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductsTab() {
  return (
    <>
      <HeaderTab
        title="Products"
        description="Manage all your resin pieces, stock, categories and sale prices."
        primaryLabel="+ Add product"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          Here you will see your product list with filters, search, and actions
          (edit, duplicate, hide, delete). For now this is a placeholder UI.
        </p>
      </PlaceholderBox>
    </>
  );
}

function OrdersTab() {
  return (
    <>
      <HeaderTab
        title="Orders"
        description="View, filter and update order statuses (Pending → Shipped → Delivered)."
        primaryLabel="View all orders"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          This section will have an orders table with status filters, search by
          ID/name, and actions like update status, add tracking number, and
          cancel order.
        </p>
      </PlaceholderBox>
    </>
  );
}

function CustomersTab() {
  return (
    <>
      <HeaderTab
        title="Customers"
        description="See your customers, order history and contact requests."
        primaryLabel="View customers"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          Later, this will show customer list, last orders, notes and contact
          messages. For now, it’s just a visual placeholder.
        </p>
      </PlaceholderBox>
    </>
  );
}

function PagesTab() {
  return (
    <>
      <HeaderTab
        title="Pages"
        description="Edit your Home, About, Contact, FAQ and Legal sections."
        primaryLabel="Open page editor"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          We’ll add simple editors for home sections, About text, Contact info,
          FAQ items and Legal terms that sync with your public site.
        </p>
      </PlaceholderBox>
    </>
  );
}

function DiscountsTab() {
  return (
    <>
      <HeaderTab
        title="Discount Codes"
        description="Create and manage coupon codes and scheduled sales."
        primaryLabel="+ Create discount"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          Imagine a table of coupons with code, type, value, start/end dates and
          active/expired badges. We’ll wire this to your cart later.
        </p>
      </PlaceholderBox>
    </>
  );
}

function SettingsTab() {
  return (
    <>
      <HeaderTab
        title="Settings"
        description="Branding, colors, social links, WhatsApp and payment methods."
        primaryLabel="Open settings"
      />
      <PlaceholderBox>
        <p style={{ margin: 0, fontSize: 13, color: "#7a6989" }}>
          In the next step, we can design sections for logo & branding, color
          palette, currency, WhatsApp number and payment methods like Wish,
          cash on delivery, etc.
        </p>
      </PlaceholderBox>
    </>
  );
}

/* =============== SMALL REUSABLE PIECES =============== */

function HeaderTab({ title, description, primaryLabel }) {
  return (
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
        <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>{title}</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7a6989" }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          border: "none",
          background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
          fontSize: 12,
          cursor: "pointer",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {primaryLabel}
      </button>
    </header>
  );
}

function PlaceholderBox({ children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 16,
        background: "#faf6ff",
        border: "1px dashed rgba(148,122,173,0.5)",
      }}
    >
      {children}
    </div>
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

function Tr({ children }) {
  return <tr>{children}</tr>;
}

function StatusTd({ status, children }) {
  const map = {
    pending: {
      bg: "rgba(255,193,7,0.15)",
      color: "#8a6b08",
    },
    shipped: {
      bg: "rgba(3,169,244,0.12)",
      color: "#04598b",
    },
    delivered: {
      bg: "rgba(76,175,80,0.12)",
      color: "#1b5e20",
    },
  };

  const sty = map[status] || {
    bg: "rgba(158,158,158,0.12)",
    color: "#424242",
  };

  return (
    <Td align="left">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 8px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          background: sty.bg,
          color: sty.color,
          textTransform: "capitalize",
        }}
      >
        {children}
      </span>
    </Td>
  );
}
