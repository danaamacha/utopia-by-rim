// frontend/src/pages/admin/AdminDiscounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const getToken = () => localStorage.getItem("auth_token") || "";

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

const fetchDiscounts  = ()          => apiFetch("/admin/discounts");
const createDiscount  = (data)      => apiFetch("/admin/discounts", { method: "POST",   body: JSON.stringify(data) });
const updateDiscount  = (id, data)  => apiFetch(`/admin/discounts/${id}`, { method: "PATCH",  body: JSON.stringify(data) });
const deleteDiscount  = (id)        => apiFetch(`/admin/discounts/${id}`, { method: "DELETE" });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function getStatus(d) {
  if (!d || !d.isActive) return "inactive";
  const today = new Date().toISOString().slice(0, 10);
  if (d.startDate && today < d.startDate) return "upcoming";
  if (d.endDate   && today > d.endDate)   return "expired";
  if (d.usageLimit != null && Number(d.usedCount || 0) >= Number(d.usageLimit)) return "used";
  return "active";
}

function getStatusConfig(status) {
  const map = {
    upcoming: { label: "Upcoming",            bg: "rgba(33,150,243,0.12)",  color: "#1565c0" },
    active:   { label: "Active",              bg: "rgba(76,175,80,0.14)",   color: "#2e7d32" },
    expired:  { label: "Expired",             bg: "rgba(158,158,158,0.18)", color: "#424242" },
    used:     { label: "Limit reached",       bg: "rgba(255,193,7,0.16)",   color: "#795548" },
    inactive: { label: "Inactive",            bg: "rgba(244,67,54,0.14)",   color: "#b71c1c" },
  };
  return map[status] || map.active;
}

function typeLabel(t) {
  if (t === "percent")      return "% Discount";
  if (t === "fixed")        return "Fixed amount";
  if (t === "free_shipping") return "Free shipping";
  return t;
}

function emptyForm() {
  return { code: "", label: "", type: "percent", value: "", minOrder: "", startDate: "", endDate: "", usageLimit: "", isActive: true };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDiscounts() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [savedFlag, setSavedFlag] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchDiscounts()
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discounts.filter((d) => {
      const status = getStatus(d);
      const inStatus = statusFilter === "all" || status === statusFilter;
      const inSearch = !q || d.code.toLowerCase().includes(q) || (d.label || "").toLowerCase().includes(q);
      return inStatus && inSearch;
    });
  }, [discounts, search, statusFilter]);

  const counts = useMemo(() => ({
    total:    discounts.length,
    active:   discounts.filter((d) => getStatus(d) === "active").length,
    upcoming: discounts.filter((d) => getStatus(d) === "upcoming").length,
    expired:  discounts.filter((d) => getStatus(d) === "expired").length,
  }), [discounts]);

  const handleEdit = (d) => {
    setEditingId(d.id);
    setFormError(null);
    setForm({
      code:       d.code,
      label:      d.label || "",
      type:       d.type || "percent",
      value:      d.value != null ? String(d.value) : "",
      minOrder:   d.minOrder != null ? String(d.minOrder) : "",
      startDate:  d.startDate || "",
      endDate:    d.endDate || "",
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
      isActive:   d.isActive ?? true,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discount code?")) return;
    try {
      await deleteDiscount(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) { setEditingId(null); setForm(emptyForm()); }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReset = () => { setEditingId(null); setForm(emptyForm()); setFormError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const code = form.code.trim().toUpperCase();
    if (!code) { setFormError("Code is required."); return; }
    if (form.type !== "free_shipping" && !form.value) { setFormError("Discount value is required."); return; }

    const payload = {
      code,
      label:      form.label.trim() || undefined,
      type:       form.type,
      value:      form.type !== "free_shipping" ? Number(form.value) : 0,
      minOrder:   form.minOrder  ? Number(form.minOrder)  : 0,
      startDate:  form.startDate  || undefined,
      endDate:    form.endDate    || undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive:   form.isActive,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateDiscount(editingId, payload);
        setDiscounts((prev) => prev.map((d) => d.id === editingId ? updated : d));
      } else {
        const created = await createDiscount(payload);
        setDiscounts((prev) => [created, ...prev]);
      }
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
      handleReset();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* HEADER */}
      <header style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>Discount codes</h1>
            <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
              Create coupon codes and scheduled sales for Utopia by Rim.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{
            padding: "7px 16px", borderRadius: 999,
            border: "1px solid rgba(124,81,161,0.5)", background: "transparent",
            color: "#4a2a73", fontSize: 12, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}>
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <StatPill label="Total"    value={counts.total} />
          <StatPill label="Active"   value={counts.active}   color="#2e7d32" bg="rgba(76,175,80,0.14)" />
          <StatPill label="Upcoming" value={counts.upcoming} color="#1565c0" bg="rgba(33,150,243,0.14)" />
          <StatPill label="Expired"  value={counts.expired}  color="#424242" bg="rgba(158,158,158,0.2)" />
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(244,67,54,0.07)", border: "1px solid rgba(244,67,54,0.3)", color: "#b71c1c", fontSize: 13 }}>
          ⚠ {error} <button onClick={load} style={{ marginLeft: 8, fontSize: 11, padding: "3px 8px", borderRadius: 999, border: "none", background: "#b71c1c", color: "#fff", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
        <input
          type="text"
          placeholder="Search by code or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: isMobile ? "1 1 100%" : "0 0 200px", padding: "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: 13, backgroundColor: "#fff", boxSizing: "border-box" }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expired">Expired</option>
          <option value="used">Limit reached</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 14, alignItems: "flex-start" }}>

        {/* LEFT: list */}
        <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#fff", padding: isMobile ? 8 : 10 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#7a6989", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: "#7a6989" }}>
              No discount codes found. Create one using the form.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((d) => (
                <DiscountCard
                  key={d.id}
                  discount={d}
                  isEditing={d.id === editingId}
                  onEdit={() => handleEdit(d)}
                  onDelete={() => handleDelete(d.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: form */}
        <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#faf6ff", padding: 14 }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>
                  {editingId ? "Edit discount" : "Create discount"}
                </h2>
                <p style={{ marginTop: 4, fontSize: 12, color: "#7a6989" }}>
                  {editingId ? "Update this coupon and save changes." : "Set up a new coupon code."}
                </p>
              </div>
              {savedFlag && (
                <span style={{ fontSize: 11, color: "#2e7d32", background: "rgba(76,175,80,0.1)", borderRadius: 999, padding: "4px 8px" }}>
                  Saved ✓
                </span>
              )}
            </div>

            {formError && (
              <div style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.3)", color: "#b71c1c", fontSize: 12 }}>
                ⚠ {formError}
              </div>
            )}

            {/* Code + type */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <FLabel label="Code" style={{ flex: 1 }}>
                <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} style={inputSt} placeholder="NOEL15" />
              </FLabel>
              <FLabel label="Type" style={{ flex: 1 }}>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inputSt}>
                  <option value="percent">% Discount</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </FLabel>
            </div>

            {/* Value + min order */}
            {form.type !== "free_shipping" && (
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                <FLabel label="Value" style={{ flex: 1 }}>
                  <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} style={inputSt} placeholder={form.type === "percent" ? "e.g. 15" : "e.g. 20"} />
                </FLabel>
                <FLabel label="Min order (optional)" style={{ flex: 1 }}>
                  <input type="number" min="0" step="0.01" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} style={inputSt} placeholder="e.g. 100" />
                </FLabel>
              </div>
            )}

            {/* Dates */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <FLabel label="Start date" style={{ flex: 1 }}>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inputSt} />
              </FLabel>
              <FLabel label="End date" style={{ flex: 1 }}>
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={inputSt} />
              </FLabel>
            </div>

            {/* Usage limit */}
            <FLabel label="Usage limit (optional)">
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} style={inputSt} placeholder="Leave empty for unlimited" />
            </FLabel>

            {/* Description */}
            <FLabel label="Description (internal)">
              <textarea value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} style={{ ...inputSt, resize: "vertical", minHeight: 60 }} placeholder="e.g. Christmas 15% off all items" />
            </FLabel>

            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4f3d5c", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              Active (visible to customers)
            </label>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: "9px 12px", borderRadius: 999, border: "none",
                background: "linear-gradient(90deg, #7c51a1, #4a2a73)", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? "Saving…" : editingId ? "Save changes" : "Create discount"}
              </button>
              {editingId && (
                <button type="button" onClick={handleReset} style={{
                  padding: "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)",
                  background: "#fff", color: "#4a2a73", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function StatPill({ label, value, color = "#3c274f", bg = "#f5effb" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, background: bg, fontSize: 11, color }}>
      <span>{label}</span>
      <strong style={{ fontSize: 12 }}>{value}</strong>
    </div>
  );
}

function FLabel({ label, children, style: extra = {} }) {
  return (
    <label style={{ fontSize: 12, color: "#4f3d5c", display: "block", ...extra }}>
      {label}
      {children}
    </label>
  );
}

const inputSt = {
  marginTop: 3, width: "100%", padding: "8px 10px", borderRadius: 10,
  border: "1px solid rgba(148,122,173,0.5)", fontSize: 13,
  boxSizing: "border-box", backgroundColor: "#fff",
};

function DiscountCard({ discount: d, isEditing, onEdit, onDelete }) {
  const status = getStatus(d);
  const cfg    = getStatusConfig(status);

  return (
    <div style={{
      borderRadius: 12, padding: 10, background: isEditing ? "#f9f3ff" : "#fff",
      border: isEditing ? "1px solid rgba(124,81,161,0.8)" : "1px solid rgba(148,122,173,0.4)",
      display: "grid", gap: 4,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#4a2a73" }}>
          {d.code}
        </div>
        <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {d.label && <div style={{ fontSize: 12, color: "#4f3d5c" }}>{d.label}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#7a6989", marginTop: 2 }}>
        <span><strong>{typeLabel(d.type)}</strong>{" "}
          {d.type === "percent"      && `${d.value}%`}
          {d.type === "fixed"        && formatMoney(d.value)}
        </span>
        {Number(d.minOrder) > 0 && <span>· Min {formatMoney(d.minOrder)}</span>}
        {d.startDate && d.endDate   && <span>· {d.startDate} → {d.endDate}</span>}
        {d.usageLimit != null       && <span>· {d.usedCount || 0}/{d.usageLimit} used</span>}
        {d.usageLimit == null && d.usedCount > 0 && <span>· {d.usedCount} used</span>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
        <button type="button" onClick={onEdit} style={{ padding: "5px 9px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)", background: "#fff", fontSize: 11, cursor: "pointer", color: "#4a2a73", fontWeight: 600 }}>
          Edit
        </button>
        <button type="button" onClick={onDelete} style={{ padding: "5px 9px", borderRadius: 999, border: "none", background: "rgba(244,67,54,0.12)", fontSize: 11, cursor: "pointer", color: "#b71c1c", fontWeight: 600 }}>
          Delete
        </button>
      </div>
    </div>
  );
}