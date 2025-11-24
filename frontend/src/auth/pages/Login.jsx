// frontend/src/auth/pages/Login.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@utopia.com"); // demo user
  const [password, setPassword] = useState("123456");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(email, password);

      // ✅ NO MORE special redirect for Rim here
      // Just go back where user came from (or home)
      nav(from, { replace: true });
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const card = {
    maxWidth: 420,
    margin: "120px auto 80px",
    background: "#fff",
    border: "1px solid #ece5f2",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 12px 24px rgba(0,0,0,.06)",
  };

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d9d2df",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 13, fontWeight: 500, color: "#4f3d5c" };

  return (
    <main style={{ padding: "20px", background: "#f6f3f8", minHeight: "80vh" }}>
      <div style={card}>
        <h2 style={{ margin: 0 }}>Welcome back</h2>
        <p style={{ marginTop: 6, color: "#6d5a7a", fontSize: 14 }}>
          Login to continue to Utopia by Rim.
        </p>

        {/* Small hint for you while developing */}
        <p style={{ marginTop: 10, fontSize: 12, color: "#a38fb5" }}>
          Demo login: <strong>demo@utopia.com</strong> / <strong>123456</strong>  
          <br />
          Owner login (Rim): <strong>rim@utopiabyrim.com</strong> / <strong>123456</strong>
        </p>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 12, marginTop: 16 }}
        >
          <label style={labelStyle}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              required
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>

          {err && (
            <div style={{ color: "#b00020", fontSize: 14, marginTop: 4 }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              background: "linear-gradient(90deg,#7c51a1,#4a2a73)",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Link to="/forgot" style={{ color: "#4a2a73" }}>
            Forgot password?
          </Link>
        </div>

        <div style={{ marginTop: 10, fontSize: 14 }}>
          New here?{" "}
          <Link to="/register" style={{ color: "#4a2a73", fontWeight: 500 }}>
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
