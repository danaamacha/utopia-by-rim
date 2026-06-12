// frontend/src/pages/admin/AdminMessages.jsx
import React, { useEffect, useMemo, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const STATUS_STYLE = {
  new: { bg: "rgba(33,150,243,0.12)", color: "#1565c0", label: "New" },
  read: { bg: "rgba(76,175,80,0.14)", color: "#2e7d32", label: "Read" },
  closed: { bg: "rgba(158,158,158,0.18)", color: "#424242", label: "Closed" },
};

export default function AdminMessages() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/contact?limit=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.items || []);
      setTotal(data.total ?? (data.items || []).length);
    } catch (e) {
      setError(e.message || "Error loading messages");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(msg, status) {
    const prev = messages;
    setMessages((arr) => arr.map((m) => (m.id === msg.id ? { ...m, status } : m)));
    setSelected((s) => (s?.id === msg.id ? { ...s, status } : s));
    try {
      const res = await fetch(`${API_BASE}/admin/contact/${msg.id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setMessages(prev);
    }
  }

  function openMessage(msg) {
    setSelected(selected?.id === msg.id ? null : msg);
    if (msg.status === "new") setStatus(msg, "read");
  }

  const filtered = useMemo(
    () => (statusFilter === "all" ? messages : messages.filter((m) => m.status === statusFilter)),
    [messages, statusFilter]
  );
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <main style={{ padding: isMobile ? "80px 10px 16px" : "90px 20px 26px", background: "#f5f0fb", minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <header style={{ marginBottom: isMobile ? 10 : 14 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, color: "#3c274f" }}>Messages</h1>
          <p style={{ marginTop: 6, fontSize: isMobile ? 11.5 : 13, color: "#7a6989" }}>
            Contact form submissions — {total} total{newCount > 0 ? `, ${newCount} new` : ""}.
          </p>
        </header>

        <div style={{ marginBottom: 12 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: isMobile ? "8px 11px" : "9px 12px", borderRadius: 999, border: "1px solid rgba(148,122,173,0.5)", fontSize: isMobile ? 12.5 : 13, backgroundColor: "#fff" }}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(176,0,32,0.07)", color: "#b00020", fontSize: 13, marginBottom: 12 }}>
            {error} —{" "}
            <button onClick={fetchMessages} style={{ background: "none", border: "none", color: "#b00020", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>retry</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile || !selected ? "1fr" : "1.4fr 1fr", gap: 14, alignItems: "flex-start" }}>
          {/* LIST */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", overflow: "hidden", background: "#fff" }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: "#7a6989", fontSize: 14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#7a6989", fontSize: 13 }}>No messages.</div>
            ) : (
              filtered.map((m) => {
                const s = STATUS_STYLE[m.status] || STATUS_STYLE.new;
                const active = selected?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => openMessage(m)}
                    style={{ padding: isMobile ? "10px 12px" : "12px 14px", borderBottom: "1px solid rgba(148,122,173,0.13)", cursor: "pointer", background: active ? "#f5effb" : "transparent" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: m.status === "new" ? 800 : 600, color: "#3c274f", fontSize: isMobile ? 12.5 : 13.5 }}>
                        {m.name}
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#7a6989", marginTop: 2 }}>{m.email}</div>
                    <div style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#4f3d5c", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: isMobile ? 240 : 460 }}>
                      {m.message}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#a38fb5", marginTop: 4 }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DETAIL */}
          {selected && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(148,122,173,0.25)", background: "#faf6ff", padding: 14, fontSize: 13, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#3c274f" }}>{selected.name}</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7a6989", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ fontSize: 12, color: "#7a6989" }}>
                <a href={`mailto:${selected.email}`} style={{ color: "#4a2a73", fontWeight: 600 }}>{selected.email}</a>
                {selected.createdAt && <> · {new Date(selected.createdAt).toLocaleString()}</>}
              </div>
              <div style={{ background: "#fff", border: "1px solid rgba(148,122,173,0.25)", borderRadius: 10, padding: 12, whiteSpace: "pre-wrap", color: "#3c274f", fontSize: 13, lineHeight: 1.6 }}>
                {selected.message}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["new", "read", "closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatus(selected, st)}
                    disabled={selected.status === st}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: selected.status === st ? "none" : "1px solid rgba(148,122,173,0.5)",
                      background: selected.status === st ? STATUS_STYLE[st].bg : "#fff",
                      color: selected.status === st ? STATUS_STYLE[st].color : "#4a2a73",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: selected.status === st ? "default" : "pointer",
                    }}
                  >
                    Mark {STATUS_STYLE[st].label.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
