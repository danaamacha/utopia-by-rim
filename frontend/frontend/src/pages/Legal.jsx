import React, { useMemo } from "react";
import useBreakpoint from "../hooks/useBreakpoint";
import { colors } from "../theme";

export default function Legal() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  // Change this when you update the policy text
  const lastUpdated = useMemo(() => "November 8, 2025", []);

  // Simple helper to scroll smoothly to a section
  const go = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      {/* Hero */}
      <section
        style={{
          background:
            `linear-gradient(rgba(0,0,0,.30), rgba(0,0,0,.30)), url(/hero.jpeg) center/cover no-repeat`,
          color: "#fff",
          minHeight: isMobile ? 150 : 220,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          paddingTop: "clamp(90px, 14vw, 120px)",
          paddingBottom: isMobile ? 16 : 26,
          paddingInline: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 40, lineHeight: 1.15 }}>
            Legal — Terms & Privacy
          </h1>
          <p style={{ marginTop: 8, opacity: 0.95, fontSize: isMobile ? 13 : 15 }}>
            Please read these terms carefully. Your use of the website means you agree.
          </p>
          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              background: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.25)",
              padding: "6px 10px",
              borderRadius: 10,
              fontSize: isMobile ? 12.5 : 13.5,
            }}
          >
            <span style={{ opacity: 0.9 }}>Last updated:</span>
            <strong>{lastUpdated}</strong>
          </div>
        </div>
      </section>

      {/* Body */}
      <section
        style={{
          background: "#faf9fb",
          padding: isMobile ? "16px 12px 70px" : "32px 20px 90px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
            gap: isMobile ? 14 : 20,
            alignItems: "start",
          }}
        >
          {/* Sticky TOC */}
          <aside
            style={{
              position: isMobile ? "static" : "sticky",
              top: 90,
              background: "#fff",
              border: "1px solid #ece5f2",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 15 }}>
              Contents
            </div>
            <nav style={{ display: "grid", gap: 8 }}>
              <a href="#terms" onClick={go("terms")} style={linkStyle}>1. Terms of Service</a>
              <a href="#accounts" onClick={go("accounts")} style={linkStyle}>2. Accounts & Eligibility</a>
              <a href="#orders" onClick={go("orders")} style={linkStyle}>3. Orders, Pricing & Payments</a>
              <a href="#shipping" onClick={go("shipping")} style={linkStyle}>4. Shipping & Delivery</a>
              <a href="#returns" onClick={go("returns")} style={linkStyle}>5. Returns & Refunds</a>
              <a href="#ip" onClick={go("ip")} style={linkStyle}>6. Intellectual Property</a>
              <a href="#liability" onClick={go("liability")} style={linkStyle}>7. Limitation of Liability</a>
              <a href="#privacy" onClick={go("privacy")} style={linkStyle}>8. Privacy Policy</a>
              <a href="#cookies" onClick={go("cookies")} style={linkStyle}>9. Cookies</a>
              <a href="#rights" onClick={go("rights")} style={linkStyle}>10. Your Rights</a>
              <a href="#security" onClick={go("security")} style={linkStyle}>11. Data Security</a>
              <a href="#law" onClick={go("law")} style={linkStyle}>12. Governing Law</a>
              <a href="#contact" onClick={go("contact")} style={linkStyle}>13. Contact Us</a>
            </nav>
          </aside>

          {/* Content */}
          <div style={{ display: "grid", gap: 16 }}>
            <Section id="terms" title="1. Terms of Service">
              <p>
                These Terms of Service (“Terms”) govern your access to and use of our website,
                products, and services (“Services”). By accessing the site or placing an order,
                you agree to these Terms.
              </p>
              <ul>
                <li>We may update these Terms from time to time; updates take effect when posted.</li>
                <li>Use the Services only for lawful purposes and in accordance with these Terms.</li>
                <li>We may suspend or terminate access for violations or misuse.</li>
              </ul>
            </Section>

            <Section id="accounts" title="2. Accounts & Eligibility">
              <p>
                When creating an account, you must provide accurate information and keep your
                credentials secure. You are responsible for activities under your account.
              </p>
              <ul>
                <li>Minimum age as required by applicable law.</li>
                <li>We reserve the right to refuse service or close accounts at our discretion.</li>
              </ul>
            </Section>

            <Section id="orders" title="3. Orders, Pricing & Payments">
              <p>
                Prices are shown in USD (or equivalent at checkout). For custom items, final pricing
                is confirmed when we approve your design. If we detect pricing errors, we may cancel
                or adjust orders with notice.
              </p>
              <ul>
                <li>Accepted payment methods are shown at checkout; charges occur at order time.</li>
                <li>Custom/personalized items may require upfront payment.</li>
                <li>Taxes, duties, and delivery fees may apply depending on location.</li>
              </ul>
            </Section>

            <Section id="shipping" title="4. Shipping & Delivery">
              <p>
                We ship across Lebanon and can arrange regional shipping on request. Delivery
                estimates are provided at checkout and may vary due to courier conditions.
              </p>
              <ul>
                <li>Dispatch for ready items is usually 1–3 business days.</li>
                <li>Custom items ship after curing/production is complete.</li>
                <li>Risk of loss passes to you upon delivery by the carrier.</li>
              </ul>
            </Section>

            <Section id="returns" title="5. Returns & Refunds">
              <p>
                Non-custom items can be returned within 7 days of delivery if unused and in the
                original packaging. Contact us first for instructions.
              </p>
              <ul>
                <li>Custom/personalized items are non-returnable unless defective or damaged.</li>
                <li>For damage, send photos within 48 hours of delivery so we can assist.</li>
                <li>Approved refunds are issued to the original payment method.</li>
              </ul>
            </Section>

            <Section id="ip" title="6. Intellectual Property">
              <p>
                All site content, product photos, designs, and branding are owned by us or our
                licensors and are protected by IP laws. You may not use, reproduce, or distribute
                content without permission.
              </p>
            </Section>

            <Section id="liability" title="7. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, we are not liable for indirect, incidental,
                or consequential damages arising from your use of the Services. Our total liability
                is limited to the amount you paid for the product(s) giving rise to the claim.
              </p>
            </Section>

            <Section id="privacy" title="8. Privacy Policy">
              <p>
                We collect information you provide (e.g., contact details, order info) and data
                generated by your use of the site (e.g., device, usage, cookies) to process orders,
                provide support, and improve our Services.
              </p>
              <ul>
                <li>We do not sell your personal data.</li>
                <li>We may share data with trusted processors (e.g., payment, delivery) under contracts.</li>
                <li>We retain data only as long as needed for the purposes above or legal requirements.</li>
              </ul>
            </Section>

            <Section id="cookies" title="9. Cookies">
              <p>
                Cookies and similar technologies help us remember preferences, keep your session
                active, and analyze site performance. You can control cookies via your browser
                settings; some features may not work without them.
              </p>
            </Section>

            <Section id="rights" title="10. Your Rights">
              <p>
                Depending on your location, you may have rights to access, correct, delete, or
                restrict processing of your personal data. You can also object to certain uses
                and request data portability.
              </p>
              <p>
                To exercise rights, contact us using the details below. We’ll verify your request
                and respond within applicable legal timeframes.
              </p>
            </Section>

            <Section id="security" title="11. Data Security">
              <p>
                We use reasonable technical and organizational measures to protect your data.
                However, no method of transmission or storage is 100% secure.
              </p>
            </Section>

            <Section id="law" title="12. Governing Law">
              <p>
                These Terms are governed by the laws applicable in Lebanon, without regard to its
                conflict of law rules. Disputes shall be handled by the competent courts in Lebanon.
              </p>
            </Section>

            <Section id="contact" title="13. Contact Us">
              <p>
                Questions about these Terms or Privacy? Reach us:
              </p>
              <ul>
                <li>Email: <a href="mailto:support@utopiabyrim.com">support@utopiabyrim.com</a></li>
                <li>WhatsApp: <a href="https://wa.me/96176107167" target="_blank" rel="noreferrer">+961 76 107 167</a></li>
              </ul>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                <a href="#terms" onClick={go("terms")} style={pillButton}>Back to Terms</a>
                <a href="#privacy" onClick={go("privacy")} style={solidButton}>Jump to Privacy</a>
              </div>
            </Section>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Reusable Section ---------- */
function Section({ id, title, children }) {
  return (
    <section
      id={id}
      style={{
        background: "#fff",
        border: "1px solid #ece5f2",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 8,
          fontSize: 18,
          fontWeight: 900,
          background: "linear-gradient(90deg, #d4af37, #f6d77e, #d4af37)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 0.3,
        }}
      >
        {title}
      </h2>
      <div style={{ color: "#5c4a71", lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </section>
  );
}

/* ---------- Styles ---------- */
const linkStyle = {
  textDecoration: "none",
  color: colors.vividPurple,
  background: "#fff",
  border: "1px solid #e6e1ea",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 800,
  fontSize: 13.5,
};

const pillButton = {
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${colors.vividPurple}`,
  color: colors.vividPurple,
  fontWeight: 900,
  background: "#fff",
  fontSize: 14,
};

const solidButton = {
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  color: "#fff",
  fontWeight: 900,
  background: `linear-gradient(90deg, ${colors.vividPurple}, ${colors.royalPlum})`,
  boxShadow: "0 10px 22px rgba(102,51,153,.18)",
  fontSize: 14,
};
