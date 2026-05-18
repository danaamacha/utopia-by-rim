import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirm:"" });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      nav("/", { replace: true });
    } catch (e2) { setErr(e2.message || "Registration failed"); }
  };

  const input = { padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" };
  const card = { maxWidth: 520, margin: "120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22, boxShadow:"0 12px 24px rgba(0,0,0,.06)" };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>Create account</h2>
        <p style={{ marginTop:6, color:"#6d5a7a" }}>Join Utopia by Rim.</p>

        <form onSubmit={onSubmit} style={{ display:"grid", gap:12, marginTop:14 }}>
          <input style={input} placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({ ...f, name:e.target.value }))} required />
          <input style={input} placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({ ...f, email:e.target.value }))} required />
          <input style={input} placeholder="Phone / WhatsApp" value={form.phone} onChange={e=>setForm(f=>({ ...f, phone:e.target.value }))} />
          <input style={input} placeholder="Password" type="password" value={form.password} onChange={e=>setForm(f=>({ ...f, password:e.target.value }))} required />
          <input style={input} placeholder="Confirm password" type="password" value={form.confirm} onChange={e=>setForm(f=>({ ...f, confirm:e.target.value }))} required />
          {err && <div style={{ color:"#b00020", fontSize:14 }}>{err}</div>}
          <button type="submit" style={{ padding:"12px 14px", borderRadius:12, border:"none", color:"#fff", background:"linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight:800 }}>
            Register
          </button>
        </form>

        <div style={{ marginTop:10, fontSize:14 }}>
          Already have an account? <Link to="/login" style={{ color:"#4a2a73" }}>Login</Link>
        </div>
      </div>
    </main>
  );
}
