import React, { useState } from "react";
import { colors, radii } from "../theme";
import { submitContact } from "../api/contact";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await submitContact({ name, email, phone, subject, message });
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: colors.deepViolet, marginTop: 0 }}>Contact</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: "12px 14px", border: `1px solid ${colors.pearlGray}`, borderRadius: radii.sm, outline: "none" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "12px 14px", border: `1px solid ${colors.pearlGray}`, borderRadius: radii.sm, outline: "none" }}
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: "12px 14px", border: `1px solid ${colors.pearlGray}`, borderRadius: radii.sm, outline: "none" }}
        />
        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          style={{ padding: "12px 14px", border: `1px solid ${colors.pearlGray}`, borderRadius: radii.sm, outline: "none" }}
        />
        <textarea
          placeholder="Your message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          style={{ padding: "12px 14px", border: `1px solid ${colors.pearlGray}`, borderRadius: radii.sm, outline: "none", resize: "vertical" }}
        />
        {error && <div style={{ color: "#b00020", fontSize: 14 }}>{error}</div>}
        {success && <div style={{ color: "#4caf50", fontSize: 14 }}>Message sent successfully!</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: colors.royalPlum,
            color: "#fff",
            border: "none",
            padding: "12px 16px",
            borderRadius: radii.sm,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </main>
  );
}
