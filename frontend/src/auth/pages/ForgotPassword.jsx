import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const card = { maxWidth: 460, margin: "120px auto 80px", background: "#fff", border: "1px solid #ece5f2", borderRadius: 16, padding: 22 };

  if (submitted) {
    return (
      <main style={{ padding: 20 }}>
        <div style={card}>
          <h2 style={{ margin: 0, color: "#3c274f" }}>Request received</h2>
          <p style={{ marginTop: 10, color: "#6d5a7a", lineHeight: 1.6 }}>
            We received your request for <strong>{email}</strong>.
          </p>
          <p style={{ color: "#6d5a7a", lineHeight: 1.6 }}>
            Please contact us directly and we'll reset your password as soon as possible:
          </p>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <a
              href="https://wa.me/2250789555552"
              target="_blank"
              rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#f5effb", border: "1px solid #e6e1ea", textDecoration: "none", color: "#3c274f", fontWeight: 600 }}
            >
              <span>💬</span> WhatsApp us
            </a>
            <a
              href="mailto:hello@utopiabyrim.com"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#f5effb", border: "1px solid #e6e1ea", textDecoration: "none", color: "#3c274f", fontWeight: 600 }}
            >
              <span>✉️</span> hello@utopiabyrim.com
            </a>
          </div>
          <Link to="/login" style={{ display: "block", marginTop: 16, textAlign: "center", color: "#7c51a1", textDecoration: "none", fontSize: 14 }}>
            ← Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <div style={card}>
        <h2 style={{ margin: 0, color: "#3c274f" }}>Forgot your password?</h2>
        <p style={{ marginTop: 6, color: "#6d5a7a", lineHeight: 1.6 }}>
          Enter your email and we'll help you get back in.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubmitted(true); }}
          style={{ display: "grid", gap: 12, marginTop: 14 }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d9d2df", fontSize: 15, outline: "none" }}
          />
          <button
            type="submit"
            style={{ padding: "12px 14px", borderRadius: 12, border: "none", color: "#fff", background: "linear-gradient(90deg,#7c51a1,#4a2a73)", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
          >
            Continue
          </button>
        </form>

        <Link to="/login" style={{ display: "block", marginTop: 14, textAlign: "center", color: "#7c51a1", textDecoration: "none", fontSize: 14 }}>
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
