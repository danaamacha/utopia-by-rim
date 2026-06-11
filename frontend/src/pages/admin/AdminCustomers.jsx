// frontend/src/pages/admin/AdminCustomers.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export default function AdminCustomers() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers(searchTerm = "") {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", sort: "desc" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`${API_BASE}/admin/customers?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || data.customers || [];
      setCustomers(arr);
      setTotal(data.total ?? arr.length);
    } catch (e) {
      setError(e.message || "Error loading customers");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <main style={{ padding: isMobile ? "80px 10px 16px" : "90px 20px 26px", background: "#f5f0fb", minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* HEADER */}
        <header style={{ marginBottom: isMobile ? 10 : 14 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Customers</h1>
          <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>
            All registered customers — {total} total.
          </p>
        </header>

        {/* SEARCH */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: 400, padding: isMobile ? "8px 11px" : "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: isMobile ? 12.5 : 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(176,0,32,0.07)", color: "#b00020", fontSize: 13, marginBottom: 12 }}>
            {error} —{" "}
            <button onClick={() => fetchCustomers()} style={{ background: "none", border: "none", color: "#b00020", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>retry</button>
          </div>
        )}

        {/* LAYOUT: list + detail */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile || !selected ? "1fr" : "1.4fr 1fr", gap: 14, alignItems: "flex-start" }}>
          {/* TABLE */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", overflow: "hidden", background: "#fff" }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: "#7a6989", fontSize: 14 }}>Loading…</div>
            ) : (
              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 400, borderCollapse: "collapse", fontSize: isMobile ? 12 : 13 }}>
                  <thead style={{ background: "#f5effb" }}>
                    <tr>
                      <Th>Customer</Th>
                      {!isMobile && <Th>Email</Th>}
                      <Th>Role</Th>
                      {!isMobile && <Th align="right">Joined</Th>}
                      <Th align="right">Orders</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><Td colSpan={5} align="center">No customers found.</Td></tr>
                    )}
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(selected?.id === c.id ? null : c)}
                        style={{ cursor: "pointer", background: selected?.id === c.id ? "#f5effb" : "transparent" }}
                      >
                        <Td>
                          <div style={{ fontWeight: 600, color: "#3c274f" }}>{c.name || "—"}</div>
                          {isMobile && <div style={{ fontSize: 11, color: "#7a6989" }}>{c.email}</div>}
                        </Td>
                        {!isMobile && <Td>{c.email || "—"}</Td>}
                        <Td>
                          <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.role === "owner" ? "rgba(124,81,161,0.14)" : "rgba(158,158,158,0.14)", color: c.role === "owner" ? "#4a2a73" : "#424242" }}>
                            {c.role || "customer"}
                          </span>
                        </Td>
                        {!isMobile && <Td align="right" style={{ fontSize: 11, color: "#7a6989" }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</Td>}
                        <Td align="right">{c.orderCount ?? "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DETAIL PANEL */}
          {selected && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#faf6ff", padding: 14, fontSize: 13, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>{selected.name || "Customer"}</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7a6989", lineHeight: 1 }}>×</button>
              </div>
              <DetailRow label="ID" value={<code style={{ fontSize: 11, wordBreak: "break-all" }}>{selected.id}</code>} />
              <DetailRow label="Email" value={selected.email || "—"} />
              <DetailRow label="Phone" value={selected.phone || "—"} />
              <DetailRow label="Role" value={selected.role || "customer"} />
              <DetailRow label="Joined" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"} />
              {selected.orderCount != null && <DetailRow label="Orders" value={selected.orderCount} />}
              {selected.totalSpent != null && <DetailRow label="Total spent" value={`$${Number(selected.totalSpent).toFixed(2)}`} />}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Th({ children, align = "left" }) {
  return <th style={{ textAlign: align, padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#4a2a73", borderBottom: "1px solid rgba(148,122,173,0.25)", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, align = "left", colSpan }) {
  return <td colSpan={colSpan} style={{ textAlign: align, padding: "8px 10px", fontSize: 12, color: "#4f3d5c", borderBottom: "1px solid rgba(148,122,173,0.13)", verticalAlign: "top" }}>{children}</td>;
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ fontWeight: 600, color: "#4f3d5c", minWidth: 90, flexShrink: 0, fontSize: 12 }}>{label}:</span>
      <span style={{ color: "#3c274f", fontSize: 12 }}>{value}</span>
    </div>
  );
}
