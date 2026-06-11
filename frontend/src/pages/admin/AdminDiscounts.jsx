// frontend/src/pages/admin/AdminDiscounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

/* ---------- Status helpers ---------- */

function getStatus(discount) {
  if (!discount) return "inactive";
  if (discount.isActive === false) return "inactive";
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const start = discount.startDate || todayStr;
  const end = discount.endDate || todayStr;
  if (now < new Date(start + "T00:00:00")) return "upcoming";
  if (now > new Date(end + "T23:59:59")) return "expired";
  if (discount.usageLimit != null && Number(discount.usedCount || 0) >= Number(discount.usageLimit)) return "used";
  return "active";
}

function getStatusConfig(status) {
  const map = {
    upcoming: { label: "Upcoming", bg: "rgba(33,150,243,0.12)", color: "#1565c0" },
    active: { label: "Active", bg: "rgba(76,175,80,0.14)", color: "#2e7d32" },
    expired: { label: "Expired", bg: "rgba(158,158,158,0.18)", color: "#424242" },
    used: { label: "Usage limit reached", bg: "rgba(255,193,7,0.16)", color: "#795548" },
    inactive: { label: "Inactive", bg: "rgba(244,67,54,0.12)", color: "#b71c1c" },
  };
  return map[status] || map.inactive;
}

function typeLabel(t) {
  if (t === "percent") return "% Discount";
  if (t === "fixed") return "Fixed amount";
  if (t === "free_shipping") return "Free shipping";
  return t;
}

function fmt(n) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

function emptyForm() {
  return { code: "", label: "", type: "percent", value: "", minOrder: "", startDate: "", endDate: "", usageLimit: "" };
}

/* ---------- Main component ---------- */

export default function AdminDiscounts() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => { fetchDiscounts(); }, []);

  async function fetchDiscounts() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/admin/discounts`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load discounts");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setDiscounts(arr);
    } catch (e) {
      setApiError(e.message || "Error loading discounts");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discounts.filter((d) => {
      const status = getStatus(d);
      const inStatus = statusFilter === "all" || status === statusFilter;
      const inSearch = !q || (d.code || "").toLowerCase().includes(q) || (d.label || "").toLowerCase().includes(q);
      return inStatus && inSearch;
    });
  }, [discounts, search, statusFilter]);

  const activeCount = discounts.filter((d) => getStatus(d) === "active").length;

  function handleEdit(discount) {
    setEditingId(discount.id);
    setSaveError("");
    setForm({
      code: discount.code || "",
      label: discount.label || "",
      type: discount.type || "percent",
      value: discount.value != null ? String(discount.value) : "",
      minOrder: discount.minOrder != null ? String(discount.minOrder) : "",
      startDate: discount.startDate ? discount.startDate.slice(0, 10) : "",
      endDate: discount.endDate ? discount.endDate.slice(0, 10) : "",
      usageLimit: discount.usageLimit != null ? String(discount.usageLimit) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this discount code?")) return;
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) { setEditingId(null); setForm(emptyForm()); }
    try {
      const res = await fetch(`${API_BASE}/admin/discounts/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      fetchDiscounts();
    }
  }

  function handleResetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setSaveError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const trimmedCode = form.code.trim().toUpperCase();
    if (!trimmedCode) { setSaveError("Code is required."); return; }
    const type = form.type || "percent";
    const valueNum = type !== "free_shipping" ? parseFloat(form.value) : 0;
    if (type !== "free_shipping" && (!valueNum || valueNum <= 0)) { setSaveError("Discount value must be greater than 0."); return; }

    const body = {
      code: trimmedCode,
      label: form.label.trim() || undefined,
      type,
      value: valueNum || undefined,
      minOrder: form.minOrder ? parseFloat(form.minOrder) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : undefined,
      isActive: true,
    };

    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/admin/discounts/${editingId}`, {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/admin/discounts`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Save failed");
      }
      await fetchDiscounts();
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
      handleResetForm();
    } catch (err) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* HEADER */}
      <header style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>Discount codes</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>Create coupon codes and scheduled sales for Utopia by Rim.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <StatPill label="Total codes" value={discounts.length} />
          <StatPill label="Active" value={activeCount} color="#2e7d32" bg="rgba(76,175,80,0.14)" />
          <StatPill label="Upcoming" value={discounts.filter((d) => getStatus(d) === "upcoming").length} color="#1565c0" bg="rgba(33,150,243,0.14)" />
          <StatPill label="Expired" value={discounts.filter((d) => getStatus(d) === "expired").length} color="#424242" bg="rgba(158,158,158,0.2)" />
        </div>
      </header>

      {/* FILTERS */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center", marginBottom: 4 }}>
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
          style={{ flex: isMobile ? "1 1 100%" : "0 0 220px", padding: "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: 13, backgroundColor: "#fff", boxSizing: "border-box" }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
          <option value="used">Usage limit reached</option>
        </select>
      </div>

      {apiError && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(176,0,32,0.07)", color: "#b00020", fontSize: 13 }}>
          {apiError} —{" "}
          <button onClick={fetchDiscounts} style={{ background: "none", border: "none", color: "#b00020", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>retry</button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 14, alignItems: "flex-start" }}>
        {/* LEFT: list */}
        <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#fff", padding: isMobile ? 8 : 10 }}>
          {loading ? (
            <div style={{ padding: 20, fontSize: 13, color: "#7a6989" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: "#7a6989" }}>No discount codes found. Create one using the form.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((d) => (
                <DiscountCard key={d.id} discount={d} onEdit={() => handleEdit(d)} onDelete={() => handleDelete(d.id)} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: form */}
        <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#faf6ff", padding: 14 }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>{editingId ? "Edit discount" : "Create discount"}</h2>
                <p style={{ marginTop: 4, fontSize: 12, color: "#7a6989" }}>
                  {editingId ? "Update this coupon and save changes." : "Set up a new coupon code or scheduled sale."}
                </p>
              </div>
              {savedFlag && <span style={{ fontSize: 11, color: "#2e7d32", background: "rgba(76,175,80,0.1)", borderRadius: 999, padding: "4px 8px" }}>Saved ✓</span>}
            </div>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <label style={fld()}>
                Code
                <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} style={inp()} placeholder="NOEL15" />
              </label>
              <label style={fld()}>
                Type
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inp()}>
                  <option value="percent">% Discount</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </label>
            </div>

            {form.type !== "free_shipping" && (
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                <label style={fld()}>
                  Value
                  <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} style={inp()} placeholder={form.type === "percent" ? "e.g. 15" : "e.g. 20"} />
                </label>
                <label style={fld()}>
                  Minimum order (optional)
                  <input type="number" min="0" step="0.01" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} style={inp()} placeholder="e.g. 100" />
                </label>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <label style={fld()}>
                Start date
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inp()} />
              </label>
              <label style={fld()}>
                End date
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={inp()} />
              </label>
            </div>

            <label style={fld()}>
              Usage limit (optional)
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} style={inp()} placeholder="e.g. 50 (leave empty for unlimited)" />
            </label>

            <label style={fld()}>
              Description (internal)
              <textarea value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} style={{ ...inp(), resize: "vertical", minHeight: 60 }} placeholder="Short description, e.g. 'Christmas 15% off'" />
            </label>

            {saveError && <div style={{ fontSize: 12, color: "#b00020" }}>{saveError}</div>}

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "9px 12px", borderRadius: 999, border: "none", background: saving ? "#9a7ab0" : "linear-gradient(90deg, #7c51a1, #4a2a73)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create discount"}
              </button>
              {editingId && (
                <button type="button" onClick={handleResetForm} style={{ flex: isMobile ? 1 : 0, padding: "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)", background: "#fff", color: "#4a2a73", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

function fld() { return { fontSize: 12, color: "#4f3d5c", display: "block", flex: 1 }; }
function inp() { return { marginTop: 3, width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(148,122,173,0.5)", fontSize: 13, boxSizing: "border-box", backgroundColor: "#fff" }; }

function StatPill({ label, value, color = "#3c274f", bg = "#f5effb" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, background: bg, fontSize: 11, color }}>
      <span>{label}</span>
      <strong style={{ fontSize: 12 }}>{value}</strong>
    </div>
  );
}

function DiscountCard({ discount, onEdit, onDelete }) {
  const status = getStatus(discount);
  const cfg = getStatusConfig(status);
  const usageText = discount.usageLimit != null
    ? `${discount.usedCount || 0}/${discount.usageLimit}`
    : discount.usedCount != null ? `${discount.usedCount} used` : null;

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(148,122,173,0.4)", padding: 10, background: "#fff", display: "grid", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#4a2a73" }}>{discount.code}</div>
        <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      </div>
      {discount.label && <div style={{ fontSize: 12, color: "#4f3d5c" }}>{discount.label}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#7a6989", marginTop: 4 }}>
        <span>
          <strong>{typeLabel(discount.type)}</strong>{" "}
          {discount.type === "percent" && `${discount.value}%`}
          {discount.type === "fixed" && fmt(discount.value)}
        </span>
        {discount.minOrder > 0 && <span>· Min order {fmt(discount.minOrder)}</span>}
        {discount.startDate && discount.endDate && <span>· {discount.startDate.slice(0, 10)} → {discount.endDate.slice(0, 10)}</span>}
        {usageText && <span>· Usage: {usageText}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
        <button type="button" onClick={onEdit} style={{ padding: "5px 9px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.6)", background: "#fff", fontSize: 11, cursor: "pointer", color: "#4a2a73", fontWeight: 600 }}>Edit</button>
        <button type="button" onClick={onDelete} style={{ padding: "5px 9px", borderRadius: 999, border: "none", background: "rgba(244,67,54,0.12)", fontSize: 11, cursor: "pointer", color: "#b71c1c", fontWeight: 600 }}>Delete</button>
      </div>
    </div>
  );
}
