import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function ResetPassword() {
  const { finishReset } = useAuth();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      finishReset({ token: token.trim(), newPassword: password });
      setOk(true);
    } catch (e2) { setErr(e2.message || "Reset failed"); }
  };

  const card = { maxWidth: 460, margin:"120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22 };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>Set new password</h2>
        <p style={{ marginTop:6, color:"#6d5a7a" }}>Enter the code you received and your new password.</p>

        <form onSubmit={onSubmit} style={{ display:"grid", gap:12, marginTop:14 }}>
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Reset code" required
            style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" type="password" required
            style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          {err && <div style={{ color:"#b00020", fontSize:14 }}>{err}</div>}
          <button type="submit" style={{ padding:"12px 14px", borderRadius:12, border:"none", color:"#fff", background:"linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight:800 }}>
            Update password
          </button>
        </form>

        {ok && <div style={{ marginTop:10, color:"#2a7b46" }}>Password updated. You can now log in.</div>}
      </div>
    </main>
  );
}
