import React, { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const LS_ORDERS = "orders_db"; // { [userId]: [{id, createdAt, total, status, items:[{name,qty,price}]}] }

function readAll() { try { return JSON.parse(localStorage.getItem(LS_ORDERS)) || {}; } catch { return {}; } }
function writeAll(obj) { localStorage.setItem(LS_ORDERS, JSON.stringify(obj)); }

export default function Orders() {
  const { user } = useAuth();
  const [db] = useState(readAll());
  const orders = useMemo(() => (db[user.id] || []).sort((a,b)=>b.createdAt - a.createdAt), [db, user.id]);

  const card = { maxWidth: 900, margin:"120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22 };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>My Orders</h2>
        <p style={{ marginTop:6, color:"#6d5a7a" }}>Track your purchases.</p>

        {orders.length === 0 ? (
          <div style={{ marginTop:10, color:"#6d5a7a" }}>No orders yet.</div>
        ) : (
          <div style={{ display:"grid", gap:10, marginTop:12 }}>
            {orders.map(o=>(
              <div key={o.id} style={{ border:"1px solid #e6e1ea", borderRadius:12, padding:12 }}>
                <div style={{ display:"flex", gap:10, justifyContent:"space-between", flexWrap:"wrap" }}>
                  <div><b>Order:</b> {o.id}</div>
                  <div><b>Date:</b> {new Date(o.createdAt).toLocaleString()}</div>
                  <div><b>Status:</b> <span style={{ color: o.status==="Delivered" ? "#2a7b46" : o.status==="Cancelled" ? "#a33" : "#6d5a7a" }}>{o.status}</span></div>
                  <div><b>Total:</b> ${o.total.toFixed(2)}</div>
                </div>
                <div style={{ marginTop:8, display:"grid", gap:6 }}>
                  {o.items.map((it, idx)=>(
                    <div key={idx} style={{ display:"flex", gap:10, justifyContent:"space-between" }}>
                      <span>{it.name} × {it.qty}</span>
                      <span>${(it.price*it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
