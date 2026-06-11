import React, { useEffect, useState } from "react";
import { getToken } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const STATUS_COLOR = {
  DELIVERED: "#2a7b46",
  CANCELLED: "#a33",
  PENDING: "#6d5a7a",
  PROCESSING: "#1565c0",
  SHIPPED: "#795548",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.orders || [];
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(arr);
      })
      .catch((e) => setError(e.message || "Error loading orders"))
      .finally(() => setLoading(false));
  }, []);

  const card = {
    maxWidth: 900,
    margin: "120px auto 80px",
    background: "#fff",
    border: "1px solid #ece5f2",
    borderRadius: 16,
    padding: 22,
  };

  return (
    <main style={{ padding: 20 }}>
      <div style={card}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
        <p style={{ marginTop: 6, color: "#6d5a7a" }}>Track your purchases.</p>

        {loading && <div style={{ marginTop: 10, color: "#6d5a7a" }}>Loading orders…</div>}

        {error && (
          <div style={{ marginTop: 10, color: "#b00020", fontSize: 14 }}>{error}</div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div style={{ marginTop: 10, color: "#6d5a7a" }}>No orders yet.</div>
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {orders.map((o) => {
              const items = o.orderItems || o.items || [];
              const total = o.total ?? items.reduce((s, it) => s + (it.price || 0) * (it.quantity || it.qty || 1), 0);
              const statusKey = (o.status || "").toUpperCase();

              return (
                <div key={o.id} style={{ border: "1px solid #e6e1ea", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div><b>Order:</b> {o.orderNumber || o.id}</div>
                    <div><b>Date:</b> {new Date(o.createdAt).toLocaleString()}</div>
                    <div>
                      <b>Status:</b>{" "}
                      <span style={{ color: STATUS_COLOR[statusKey] || "#6d5a7a" }}>
                        {o.status}
                      </span>
                    </div>
                    <div><b>Total:</b> ${Number(total).toFixed(2)}</div>
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    {items.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10, justifyContent: "space-between", fontSize: 14 }}>
                        <span>{it.productName || it.name} × {it.quantity || it.qty || 1}</span>
                        <span>${((it.price || 0) * (it.quantity || it.qty || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {o.addressLine1 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#7a6989" }}>
                      Ships to: {o.addressLine1}, {o.city}, {o.country}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
