import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { colors } from "../../theme";

const inputBase = {
  padding: "12px 14px",
  borderRadius: 12,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

function Field({ id, type = "text", placeholder, value, onChange, error }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{ ...inputBase, border: `1px solid ${error ? "#d55" : "#d9d2df"}` }}
      />
      {error && <span style={{ fontSize: 12, color: "#b00020" }}>{error}</span>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email is required.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      nav("/", { replace: true });
    } catch (err) {
      setServerErr(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const card = {
    maxWidth: 520,
    margin: "120px auto 80px",
    background: "#fff",
    border: "1px solid #ece5f2",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 12px 24px rgba(0,0,0,.06)",
  };

  const label = { fontSize: 13, fontWeight: 500, color: "#4f3d5c" };

  return (
    <main style={{ padding: 20, background: "#f6f3f8", minHeight: "80vh" }}>
      <div style={card}>
        <h2 style={{ margin: 0, color: "#3c274f" }}>Create account</h2>
        <p style={{ marginTop: 6, color: "#6d5a7a", fontSize: 14 }}>
          Join Utopia by Rim and track your orders.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="name" style={label}>Full name</label>
            <Field id="name" placeholder="Your name" value={form.name} onChange={set("name")} error={errors.name} />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="email" style={label}>Email</label>
            <Field id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} error={errors.email} />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="phone" style={label}>
              Phone / WhatsApp <span style={{ color: "#9b8cab", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+961 ..."
              value={form.phone}
              onChange={set("phone")}
              style={{ ...inputBase, border: "1px solid #d9d2df" }}
            />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="password" style={label}>Password</label>
            <Field id="password" type="password" placeholder="At least 6 characters" value={form.password} onChange={set("password")} error={errors.password} />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label htmlFor="confirm" style={label}>Confirm password</label>
            <Field id="confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
          </div>

          {serverErr && (
            <div style={{ color: "#b00020", fontSize: 14, background: "#fff2f2", border: "1px solid #f5c2c2", borderRadius: 10, padding: "10px 14px" }}>
              {serverErr}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 14px",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              background: `linear-gradient(90deg, ${colors.vividPurple}, #4a2a73)`,
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14, color: "#6d5a7a" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4a2a73", fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
