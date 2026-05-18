// frontend/src/pages/admin/AdminDiscounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const LS_DISCOUNTS_KEY = "discounts_v1";

/* ---------- Storage helpers ---------- */

function readDiscounts() {
  try {
    const raw = localStorage.getItem(LS_DISCOUNTS_KEY);
    if (!raw) return seedDemoDiscounts();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return seedDemoDiscounts();
    return arr;
  } catch {
    return seedDemoDiscounts();
  }
}

function writeDiscounts(arr) {
  try {
    localStorage.setItem(LS_DISCOUNTS_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function seedDemoDiscounts() {
  const today = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const demo = [
    {
      id: "d1",
      code: "UTOPIA10",
      label: "10% off on all items",
      type: "percent", // percent | fixed | free_shipping
      value: 10,
      minOrder: 0,
      startDate: new Date(today.getTime() - dayMs).toISOString().slice(0, 10),
      endDate: new Date(today.getTime() + 7 * dayMs).toISOString().slice(0, 10),
      usageLimit: 50,
      usedCount: 5,
      createdAt: today.toISOString(),
      deleted: false,
    },
    {
      id: "d2",
      code: "WINTER25",
      label: "25$ off orders above $150",
      type: "fixed",
      value: 25,
      minOrder: 150,
      startDate: new Date(today.getTime() + dayMs).toISOString().slice(0, 10),
      endDate: new Date(today.getTime() + 10 * dayMs).toISOString().slice(0, 10),
      usageLimit: 100,
      usedCount: 0,
      createdAt: today.toISOString(),
      deleted: false,
    },
    {
      id: "d3",
      code: "FREESHIP",
      label: "Free shipping on selected days",
      type: "free_shipping",
      value: 0,
      minOrder: 0,
      startDate: new Date(today.getTime() - 5 * dayMs).toISOString().slice(0, 10),
      endDate: new Date(today.getTime() - dayMs).toISOString().slice(0, 10),
      usageLimit: null,
      usedCount: 20,
      createdAt: today.toISOString(),
      deleted: false,
    },
  ];

  writeDiscounts(demo);
  return demo;
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toFixed(2)}`;
}

/* ---------- Status + helpers ---------- */

function getStatus(discount) {
  if (!discount || discount.deleted) return "deleted";
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const start = discount.startDate || todayStr;
  const end = discount.endDate || todayStr;

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T23:59:59");

  if (now < startDate) return "upcoming";
  if (now > endDate) return "expired";

  if (
    discount.usageLimit != null &&
    Number(discount.usedCount || 0) >= Number(discount.usageLimit)
  ) {
    return "used";
  }

  return "active";
}

function getStatusConfig(status) {
  const map = {
    upcoming: {
      label: "Upcoming",
      bg: "rgba(33,150,243,0.12)",
      color: "#1565c0",
    },
    active: {
      label: "Active",
      bg: "rgba(76,175,80,0.14)",
      color: "#2e7d32",
    },
    expired: {
      label: "Expired",
      bg: "rgba(158,158,158,0.18)",
      color: "#424242",
    },
    used: {
      label: "Usage limit reached",
      bg: "rgba(255,193,7,0.16)",
      color: "#795548",
    },
    deleted: {
      label: "Deleted",
      bg: "rgba(244,67,54,0.16)",
      color: "#b71c1c",
    },
  };
  return map[status] || map.active;
}

function typeLabel(t) {
  if (t === "percent") return "% Discount";
  if (t === "fixed") return "Fixed amount";
  if (t === "free_shipping") return "Free shipping";
  return t;
}

/* ---------- Main component ---------- */

export default function AdminDiscounts() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [discounts, setDiscounts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | upcoming | expired | used
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    const data = readDiscounts().filter((d) => !d.deleted);
    // newest first
    data.sort((a, b) => {
      const ta = +new Date(a.createdAt || 0);
      const tb = +new Date(b.createdAt || 0);
      return tb - ta;
    });
    setDiscounts(data);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discounts.filter((d) => {
      const status = getStatus(d);

      const inStatus =
        statusFilter === "all" ? true : status === statusFilter;

      const inSearch =
        !q ||
        d.code.toLowerCase().includes(q) ||
        (d.label && d.label.toLowerCase().includes(q));

      return inStatus && inSearch;
    });
  }, [discounts, search, statusFilter]);

  const totalCount = discounts.length;
  const activeCount = discounts.filter((d) => getStatus(d) === "active")
    .length;

  const handleEdit = (discount) => {
    setEditingId(discount.id);
    setForm({
      code: discount.code,
      label: discount.label || "",
      type: discount.type || "percent",
      value: discount.value != null ? String(discount.value) : "",
      minOrder:
        discount.minOrder != null ? String(discount.minOrder) : "",
      startDate: discount.startDate || "",
      endDate: discount.endDate || "",
      usageLimit:
        discount.usageLimit != null
          ? String(discount.usageLimit)
          : "",
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this discount code?")) return;
    setDiscounts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      writeDiscounts(next);
      return next;
    });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedCode = form.code.trim().toUpperCase();
    if (!trimmedCode) {
      alert("Code is required.");
      return;
    }

    const type = form.type || "percent";
    const valueNum =
      type === "percent" || type === "fixed"
        ? Number(form.value || 0)
        : 0;

    if ((type === "percent" || type === "fixed") && !valueNum) {
      alert("Discount value must be greater than 0.");
      return;
    }

    const minOrder = form.minOrder ? Number(form.minOrder) : 0;
    const usageLimit = form.usageLimit
      ? Number(form.usageLimit)
      : null;

    setDiscounts((prev) => {
      let next;
      if (editingId) {
        next = prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                code: trimmedCode,
                label: form.label.trim(),
                type,
                value: valueNum,
                minOrder,
                startDate: form.startDate || "",
                endDate: form.endDate || "",
                usageLimit,
              }
            : d
        );
      } else {
        const id = "d" + Date.now().toString(36);
        const rec = {
          id,
          code: trimmedCode,
          label: form.label.trim(),
          type,
          value: valueNum,
          minOrder,
          startDate: form.startDate || "",
          endDate: form.endDate || "",
          usageLimit,
          usedCount: 0,
          createdAt: new Date().toISOString(),
          deleted: false,
        };
        next = [rec, ...prev];
      }
      writeDiscounts(next);
      return next;
    });

    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1500);
    handleResetForm();
  };

  const layoutStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
    gap: 14,
    alignItems: "flex-start",
  };

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
          flexDirection: "column",
          gap: 4,
          marginBottom: 4,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>
            Discount codes
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            Create coupon codes and scheduled sales for Utopia by Rim.
          </p>
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 4,
          }}
        >
          <StatPill
            label="Total codes"
            value={totalCount}
          />
          <StatPill
            label="Active"
            value={activeCount}
            color="#2e7d32"
            bg="rgba(76,175,80,0.14)"
          />
          <StatPill
            label="Upcoming"
            value={
              discounts.filter((d) => getStatus(d) === "upcoming")
                .length
            }
            color="#1565c0"
            bg="rgba(33,150,243,0.14)"
          />
          <StatPill
            label="Expired"
            value={
              discounts.filter((d) => getStatus(d) === "expired")
                .length
            }
            color="#424242"
            bg="rgba(158,158,158,0.2)"
          />
        </div>
      </header>

      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 10,
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : 220,
          }}
        >
          <input
            type="text"
            placeholder="Search by code or description…"
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

        <div
          style={{
            flex: isMobile ? "1 1 100%" : "0 0 220px",
            minWidth: isMobile ? "100%" : 160,
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="used">Usage limit reached</option>
          </select>
        </div>

        {!isMobile && <div style={{ flex: 1 }} />}
      </div>

      {/* MAIN LAYOUT: list + editor */}
      <div style={layoutStyle}>
        {/* LEFT: codes list */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#fff",
            padding: isMobile ? 8 : 10,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 12,
                fontSize: 13,
                color: "#7a6989",
              }}
            >
              No discount codes found. Create a new one using the form
              on the right.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {filtered.map((d) => (
                <DiscountCard
                  key={d.id}
                  discount={d}
                  onEdit={() => handleEdit(d)}
                  onDelete={() => handleDelete(d.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: create / edit form */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            background: "#faf6ff",
            padding: 14,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "#3c274f",
                  }}
                >
                  {editingId ? "Edit discount" : "Create discount"}
                </h2>
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#7a6989",
                  }}
                >
                  {editingId
                    ? "Update this coupon and save changes."
                    : "Set up a new coupon code or scheduled sale."}
                </p>
              </div>
              {savedFlag && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#2e7d32",
                    background: "rgba(76,175,80,0.1)",
                    borderRadius: 999,
                    padding: "4px 8px",
                  }}
                >
                  Saved ✓
                </span>
              )}
            </div>

            {/* Code + type */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
              }}
            >
              <label style={fieldLabelStyle()}>
                Code
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  style={textInputStyle()}
                  placeholder="NOEL15"
                />
              </label>

              <label style={fieldLabelStyle()}>
                Type
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  style={textInputStyle()}
                >
                  <option value="percent">% Discount</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </label>
            </div>

            {/* Value + min order */}
            {form.type !== "free_shipping" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 8,
                }}
              >
                <label style={fieldLabelStyle()}>
                  Value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: e.target.value }))
                    }
                    style={textInputStyle()}
                    placeholder={
                      form.type === "percent" ? "e.g. 15" : "e.g. 20"
                    }
                  />
                </label>

                <label style={fieldLabelStyle()}>
                  Minimum order (optional)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minOrder: e.target.value,
                      }))
                    }
                    style={textInputStyle()}
                    placeholder="e.g. 100"
                  />
                </label>
              </div>
            )}

            {/* Date range */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
              }}
            >
              <label style={fieldLabelStyle()}>
                Start date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      startDate: e.target.value,
                    }))
                  }
                  style={textInputStyle()}
                />
              </label>

              <label style={fieldLabelStyle()}>
                End date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      endDate: e.target.value,
                    }))
                  }
                  style={textInputStyle()}
                />
              </label>
            </div>

            {/* Usage limit */}
            <label style={fieldLabelStyle()}>
              Usage limit (optional)
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usageLimit: e.target.value,
                  }))
                }
                style={textInputStyle()}
                placeholder="e.g. 50 (leave empty for unlimited)"
              />
            </label>

            {/* Label / description */}
            <label style={fieldLabelStyle()}>
              Description (internal)
              <textarea
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                style={textAreaStyle(3)}
                placeholder="Short description, e.g. 'Christmas 15% on all items'"
              />
            </label>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(90deg, #7c51a1, #4a2a73)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {editingId ? "Save changes" : "Create discount"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: isMobile ? 1 : 0,
                    padding: "9px 12px",
                    borderRadius: 999,
                    border:
                      "1px solid rgba(148,122,173,0.6)",
                    background: "#fff",
                    color: "#4a2a73",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers for form + UI ---------- */

function emptyForm() {
  return {
    code: "",
    label: "",
    type: "percent",
    value: "",
    minOrder: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  };
}

function fieldLabelStyle() {
  return {
    fontSize: 12,
    color: "#4f3d5c",
    display: "block",
  };
}

function textInputStyle() {
  return {
    marginTop: 3,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,122,173,0.5)",
    fontSize: 13,
    boxSizing: "border-box",
    backgroundColor: "#fff",
  };
}

function textAreaStyle(rows = 4) {
  return {
    ...textInputStyle(),
    resize: "vertical",
    minHeight: rows * 20,
  };
}

function StatPill({ label, value, color = "#3c274f", bg = "#f5effb" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px",
        borderRadius: 999,
        background: bg,
        fontSize: 11,
        color,
      }}
    >
      <span>{label}</span>
      <strong style={{ fontSize: 12 }}>{value}</strong>
    </div>
  );
}

/* ---------- Discount card ---------- */

function DiscountCard({ discount, onEdit, onDelete }) {
  const status = getStatus(discount);
  const cfg = getStatusConfig(status);

  const isPercent = discount.type === "percent";
  const isFixed = discount.type === "fixed";
  const isFreeShip = discount.type === "free_shipping";

  const usageText =
    discount.usageLimit != null
      ? `${discount.usedCount || 0}/${discount.usageLimit}`
      : discount.usedCount != null
      ? `${discount.usedCount} used`
      : "No tracking";

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(148,122,173,0.4)",
        padding: 10,
        background: "#fff",
        display: "grid",
        gap: 4,
      }}
    >
      {/* Top row: code + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 14,
            fontWeight: 700,
            color: "#4a2a73",
          }}
        >
          {discount.code}
        </div>
        <span
          style={{
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

      {/* Label */}
      {discount.label && (
        <div
          style={{
            fontSize: 12,
            color: "#4f3d5c",
          }}
        >
          {discount.label}
        </div>
      )}

      {/* Info row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 11,
          color: "#7a6989",
          marginTop: 4,
        }}
      >
        <span>
          <strong>{typeLabel(discount.type)}</strong>{" "}
          {isPercent && `${discount.value}%`}
          {isFixed && `${formatMoney(discount.value)}`}
          {isFreeShip && ""}
        </span>
        {discount.minOrder > 0 && (
          <span>· Min order {formatMoney(discount.minOrder)}</span>
        )}
        {discount.startDate && discount.endDate && (
          <span>
            · {discount.startDate} → {discount.endDate}
          </span>
        )}
        {discount.usageLimit != null && (
          <span>· Usage: {usageText}</span>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 6,
          marginTop: 6,
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          style={{
            padding: "5px 9px",
            borderRadius: 999,
            border: "1px solid rgba(148,122,173,0.6)",
            background: "#fff",
            fontSize: 11,
            cursor: "pointer",
            color: "#4a2a73",
            fontWeight: 600,
          }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: "5px 9px",
            borderRadius: 999,
            border: "none",
            background: "rgba(244,67,54,0.12)",
            fontSize: 11,
            cursor: "pointer",
            color: "#b71c1c",
            fontWeight: 600,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
