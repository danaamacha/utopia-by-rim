import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function ForgotPassword() {
  const { startResetFlow } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(null);
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      const token = startResetFlow(email.trim());
      setSent({ email, token });
    } catch(e2) { setErr(e2.message || "Something went wrong"); }
  };

  const card = { maxWidth: 460, margin:"120px auto 80px", background:"#fff", border:"1px solid #ece5f2", borderRadius:16, padding:22 };

  return (
    <main style={{ padding:20 }}>
      <div style={card}>
        <h2 style={{ margin:0 }}>Reset password</h2>
        <p style={{ marginTop:6, color:"#6d5a7a" }}>Enter your email to receive a reset code.</p>

        <form onSubmit={onSubmit} style={{ display:"grid", gap:12, marginTop:14 }}>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="Email" style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #d9d2df" }}/>
          {err && <div style={{ color:"#b00020", fontSize:14 }}>{err}</div>}
          <button type="submit" style={{ padding:"12px 14px", borderRadius:12, border:"none", color:"#fff", background:"linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight:800 }}>
            Send reset code
          </button>
        </form>

        {sent && (
          <div style={{ marginTop:12, background:"#f7f3fa", border:"1px solid #e6e1ea", borderRadius:12, padding:12, fontSize:14 }}>
            Demo mode: Your reset code is <b>{sent.token}</b>. Go to the Reset page to set a new password.
          </div>
        )}
      </div>
    </main>
  );
}
