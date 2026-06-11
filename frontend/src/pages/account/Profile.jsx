import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [msg, setMsg] = useState("");

  if (!user) return null;

  const onSave = (e) => {
    e.preventDefault();
    updateProfile({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() });
    setMsg("Profile updated.");
    setTimeout(()=>setMsg(""), 1500);
  };

  const card = { maxWidth: 720, margin:"120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22 };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>My Profile</h2>
        <p style={{ marginTop:6, color:"#6d5a7a" }}>Update your details.</p>

        <form onSubmit={onSave} style={{ display:"grid", gap:12, marginTop:14 }}>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name"
            style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" type="email"
            style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone / WhatsApp"
            style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          <div style={{ display:"flex", gap:8 }}>
            <button type="submit" style={{ padding:"12px 14px", borderRadius:12, border:"none", color:"#fff", background:"linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight:800 }}>
              Save
            </button>
            <button type="button" onClick={logout} style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df", background:"#fff" }}>
              Logout
            </button>
          </div>
        </form>
        {msg && <div style={{ marginTop:10, color:"#2a7b46" }}>{msg}</div>}
      </div>
    </main>
  );
}
