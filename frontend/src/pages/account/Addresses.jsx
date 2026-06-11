import React, { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const LS_ADDR = "addresses_db"; // { [userId]: [{id,label,line,city,country,phone}] }

function readAll() { try { return JSON.parse(localStorage.getItem(LS_ADDR)) || {}; } catch { return {}; } }
function writeAll(obj) { localStorage.setItem(LS_ADDR, JSON.stringify(obj)); }

export default function Addresses() {
  const { user } = useAuth();
  const [db, setDb] = useState(readAll());
  const items = useMemo(() => db[user.id] || [], [db, user.id]);

  const [form, setForm] = useState({ label:"Home", line:"", city:"", country:"", phone:"" });
  const [editId, setEditId] = useState(null);

  const save = (e) => {
    e.preventDefault();
    const all = readAll();
    const list = all[user.id] || [];
    if (editId) {
      const i = list.findIndex(x => x.id === editId);
      if (i >= 0) list[i] = { ...list[i], ...form };
    } else {
      list.push({ id: "a"+Date.now().toString(36), ...form });
    }
    all[user.id] = list;
    writeAll(all);
    setDb(all);
    setForm({ label:"Home", line:"", city:"", country:"", phone:"" });
    setEditId(null);
  };

  const del = (id) => {
    const all = readAll();
    const list = (all[user.id] || []).filter(x => x.id !== id);
    all[user.id] = list;
    writeAll(all);
    setDb(all);
  };

  const card = { maxWidth: 900, margin:"120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22 };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>Addresses</h2>

        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16, marginTop:16 }}>
          <form onSubmit={save} style={{ display:"grid", gap:10, background:"#faf9fb", border:"1px solid #e6e1ea", borderRadius:12, padding:12 }}>
            <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Label (Home, Office…)" style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #d9d2df" }} />
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #d9d2df" }} />
            </div>
            <input value={form.line} onChange={e=>setForm(f=>({...f,line:e.target.value}))} placeholder="Address line" style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #d9d2df" }} />
            <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
              <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="City" style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #d9d2df" }} />
              <input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} placeholder="Country" style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #d9d2df" }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button type="submit" style={{ padding:"10px 14px", borderRadius:10, border:"none", color:"#fff", background:"linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight:800 }}>
                {editId ? "Update" : "Add"} Address
              </button>
              {editId && (
                <button type="button" onClick={()=>{ setEditId(null); setForm({ label:"Home", line:"", city:"", country:"", phone:"" }); }}
                  style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #d9d2df", background:"#fff" }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* list */}
          <div style={{ display:"grid", gap:10 }}>
            {items.length === 0 ? (
              <div style={{ color:"#6d5a7a" }}>No addresses yet.</div>
            ) : items.map(a=>(
              <div key={a.id} style={{ border:"1px solid #e6e1ea", borderRadius:12, padding:12, display:"grid", gap:4 }}>
                <b>{a.label}</b>
                <span>{a.line}</span>
                <span>{a.city} • {a.country}</span>
                <span>{a.phone}</span>
                <div style={{ display:"flex", gap:8, marginTop:6 }}>
                  <button onClick={() => { setEditId(a.id); setForm({ label:a.label, line:a.line, city:a.city, country:a.country, phone:a.phone }); }}
                    style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #d9d2df", background:"#fff" }}>
                    Edit
                  </button>
                  <button onClick={() => del(a.id)}
                    style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #f2c8cd", background:"#fff", color:"#a33" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
