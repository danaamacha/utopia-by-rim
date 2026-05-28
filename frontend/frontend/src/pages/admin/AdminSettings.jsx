// frontend/src/pages/admin/AdminSettings.jsx
import React, { useEffect, useState } from "react";
import useBreakpoint from "../../hooks/useBreakpoint";

const LS_SETTINGS_KEY = "site_settings_v1";

/* ---------------- Storage helpers ---------------- */

function defaultSettings() {
  return {
    // Branding
    brandName: "Utopia by Rim",
    logoUrl: "/rim_logo.png",
    faviconUrl: "",
    adminAvatarUrl: "",

    // Colors & theme
    primaryColor: "#7c51a1",
    accentColor: "#d4af37",
    backgroundColor: "#f6f0ff",
    textColor: "#2b1b3a",

    // Hero images (home)
    heroImageDesktop:
      "https://images.pexels.com/photos/1567838/pexels-photo-1567838.jpeg",
    heroImageMobile:
      "https://images.pexels.com/photos/1121123/pexels-photo-1121123.jpeg",

    // Contact & socials
    whatsappNumber: "+961 70 000 000",
    emailPublic: "hello@utopiabyrim.com",
    instagramUrl: "https://instagram.com/utopiabyrim",
    tiktokUrl: "",
    facebookUrl: "",
    websiteUrl: "https://utopiabyrim.com",

    // Currency & region
    currencyCode: "USD",
    currencySymbol: "$",
    currencyDisplay: "symbol", // symbol | code
    country: "Lebanon",
    city: "Beirut",

    // Payment methods
    payCashOnDelivery: true,
    payWishMoney: true,
    payBankTransfer: false,
    payCardOnline: false,

    // Other
    lowStockThreshold: 3,
    orderNotificationEmail: "orders@utopiabyrim.com",
  };
}

function readSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    return { ...defaultSettings(), ...parsed };
  } catch {
    return defaultSettings();
  }
}

function writeSettings(obj) {
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

/* ---------------- Styles helpers ---------------- */

function fieldLabelStyle() {
  return {
    fontSize: 12,
    color: "#4f3d5c",
    display: "block",
  };
}

function textInputStyle() {
  return {
    marginTop: 3,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,122,173,0.5)",
    fontSize: 13,
    boxSizing: "border-box",
    backgroundColor: "#fff",
  };
}

function textAreaStyle(rows = 3) {
  return {
    ...textInputStyle(),
    resize: "vertical",
    minHeight: rows * 20,
  };
}

/* ---------------- Main component ---------------- */

export default function AdminSettings() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;

  const [settings, setSettings] = useState(() => readSettings());
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setSettings((prev) => ({ ...defaultSettings(), ...prev }));
  }, []);

  const update = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateBool = (field, checked) => {
    setSettings((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const onSave = (e) => {
    if (e) e.preventDefault();
    writeSettings(settings);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1500);
  };

  const layout = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
    gap: 14,
    alignItems: "flex-start",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#3c274f" }}>
            Settings
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "#7a6989" }}>
            Manage branding, colors, hero images, contact details and payment
            methods for Utopia by Rim.
          </p>
          <p style={{ marginTop: 2, fontSize: 11, color: "#a38fb5" }}>
            These settings are saved in your browser (demo). Later we can move
            them to a real backend.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {savedFlag && (
            <span
              style={{
                fontSize: 11,
                color: "#2e7d32",
                background: "rgba(76,175,80,0.1)",
                borderRadius: 999,
                padding: "4px 8px",
              }}
            >
              Saved ✓
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save settings
          </button>
        </div>
      </header>

      {/* LAYOUT */}
      <div style={layout}>
        {/* LEFT COLUMN: branding + visuals + colors */}
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {/* BRANDING CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "#3c274f",
                  }}
                >
                  Branding
                </h2>
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#7a6989",
                  }}
                >
                  Brand name, logo and basic identity.
                </p>
              </div>

              {settings.logoUrl && (
                <div
                  style={{
                    borderRadius: 12,
                    padding: 6,
                    background: "#faf6ff",
                    border: "1px solid rgba(148,122,173,0.35)",
                  }}
                >
                  <img
                    src={settings.logoUrl}
                    alt="Logo preview"
                    style={{
                      height: 42,
                      width: "auto",
                      display: "block",
                    }}
                  />
                </div>
              )}
            </div>

            <label style={fieldLabelStyle()}>
              Brand name
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => update("brandName", e.target.value)}
                style={textInputStyle()}
                placeholder="Utopia by Rim"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Logo image URL
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="/rim_logo.png or full https:// link"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Favicon URL (optional)
              <input
                type="text"
                value={settings.faviconUrl}
                onChange={(e) => update("faviconUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="Small icon for browser tab"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Admin avatar URL (optional)
              <input
                type="text"
                value={settings.adminAvatarUrl}
                onChange={(e) => update("adminAvatarUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="Photo of Rim to show in admin header"
              />
            </label>
          </section>

          {/* COLORS CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#3c274f",
                }}
              >
                Colors & theme
              </h2>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                Control your main brand colors. Later the frontend can read these.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
                gap: 10,
              }}
            >
              <ColorField
                label="Primary color"
                value={settings.primaryColor}
                onChange={(val) => update("primaryColor", val)}
              />
              <ColorField
                label="Accent color (gold)"
                value={settings.accentColor}
                onChange={(val) => update("accentColor", val)}
              />
              <ColorField
                label="Background color"
                value={settings.backgroundColor}
                onChange={(val) => update("backgroundColor", val)}
              />
              <ColorField
                label="Text color"
                value={settings.textColor}
                onChange={(val) => update("textColor", val)}
              />
            </div>

            <label style={{ ...fieldLabelStyle(), marginTop: 6 }}>
              Currency display
              <select
                value={settings.currencyDisplay}
                onChange={(e) => update("currencyDisplay", e.target.value)}
                style={textInputStyle()}
              >
                <option value="symbol">
                  Use symbol ({settings.currencySymbol || "$"} 120.00)
                </option>
                <option value="code">
                  Use code ({settings.currencyCode || "USD"} 120.00)
                </option>
              </select>
            </label>
          </section>

          {/* HERO IMAGES CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#3c274f",
                }}
              >
                Hero images
              </h2>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                Background images for your main Home hero section (desktop and
                mobile).
              </p>
            </div>

            <label style={fieldLabelStyle()}>
              Desktop hero image URL
              <input
                type="text"
                value={settings.heroImageDesktop}
                onChange={(e) =>
                  update("heroImageDesktop", e.target.value)
                }
                style={textInputStyle()}
                placeholder="Large banner image for desktop"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Mobile hero image URL
              <input
                type="text"
                value={settings.heroImageMobile}
                onChange={(e) =>
                  update("heroImageMobile", e.target.value)
                }
                style={textInputStyle()}
                placeholder="Mobile friendly version of the hero"
              />
            </label>
          </section>
        </div>

        {/* RIGHT COLUMN: contact, socials, currency, payments */}
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {/* CONTACT & SOCIALS CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#3c274f",
                }}
              >
                Contact & social links
              </h2>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                These are used on your Contact section and footer.
              </p>
            </div>

            <label style={fieldLabelStyle()}>
              Public email
              <input
                type="email"
                value={settings.emailPublic}
                onChange={(e) => update("emailPublic", e.target.value)}
                style={textInputStyle()}
                placeholder="hello@utopiabyrim.com"
              />
            </label>

            <label style={fieldLabelStyle()}>
              WhatsApp number
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) =>
                  update("whatsappNumber", e.target.value)
                }
                style={textInputStyle()}
                placeholder="+961 70 000 000"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Website URL
              <input
                type="text"
                value={settings.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="https://utopiabyrim.com"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Instagram
              <input
                type="text"
                value={settings.instagramUrl}
                onChange={(e) =>
                  update("instagramUrl", e.target.value)
                }
                style={textInputStyle()}
                placeholder="https://instagram.com/utopiabyrim"
              />
            </label>

            <label style={fieldLabelStyle()}>
              TikTok
              <input
                type="text"
                value={settings.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="https://www.tiktok.com/@utopiabyrim"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Facebook
              <input
                type="text"
                value={settings.facebookUrl}
                onChange={(e) => update("facebookUrl", e.target.value)}
                style={textInputStyle()}
                placeholder="https://facebook.com/..."
              />
            </label>
          </section>

          {/* CURRENCY & REGION CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#3c274f",
                }}
              >
                Currency & region
              </h2>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                Control how prices are displayed in your shop.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
              }}
            >
              <label style={fieldLabelStyle()}>
                Currency code
                <input
                  type="text"
                  value={settings.currencyCode}
                  onChange={(e) =>
                    update("currencyCode", e.target.value.toUpperCase())
                  }
                  style={textInputStyle()}
                  placeholder="USD, EUR, LBP..."
                />
              </label>

              <label style={fieldLabelStyle()}>
                Currency symbol
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) =>
                    update("currencySymbol", e.target.value)
                  }
                  style={textInputStyle()}
                  placeholder="$, €, ل.ل."
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
              }}
            >
              <label style={fieldLabelStyle()}>
                Country
                <input
                  type="text"
                  value={settings.country}
                  onChange={(e) => update("country", e.target.value)}
                  style={textInputStyle()}
                  placeholder="Lebanon"
                />
              </label>

              <label style={fieldLabelStyle()}>
                City
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => update("city", e.target.value)}
                  style={textInputStyle()}
                  placeholder="Beirut"
                />
              </label>
            </div>
          </section>

          {/* PAYMENT METHODS CARD */}
          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,122,173,0.25)",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#3c274f",
                }}
              >
                Payment methods
              </h2>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#7a6989",
                }}
              >
                Enable or disable payment options for checkout.
              </p>
            </div>

            <ToggleRow
              checked={settings.payCashOnDelivery}
              onChange={(checked) =>
                updateBool("payCashOnDelivery", checked)
              }
              label="Cash on delivery"
              description="Customer pays when the order is delivered."
            />

            <ToggleRow
              checked={settings.payWishMoney}
              onChange={(checked) =>
                updateBool("payWishMoney", checked)
              }
              label="Wish Money / local wallet"
              description="Accept payment through Wish Money or similar local service."
            />

            <ToggleRow
              checked={settings.payBankTransfer}
              onChange={(checked) =>
                updateBool("payBankTransfer", checked)
              }
              label="Bank transfer"
              description="Customer transfers to your bank account and sends proof."
            />

            <ToggleRow
              checked={settings.payCardOnline}
              onChange={(checked) =>
                updateBool("payCardOnline", checked)
              }
              label="Credit / debit card (online)"
              description="For future integration with a payment gateway."
            />

            <label style={fieldLabelStyle()}>
              Order notifications email
              <input
                type="email"
                value={settings.orderNotificationEmail}
                onChange={(e) =>
                  update("orderNotificationEmail", e.target.value)
                }
                style={textInputStyle()}
                placeholder="Where to receive new order emails"
              />
            </label>

            <label style={fieldLabelStyle()}>
              Low stock threshold
              <input
                type="number"
                min="0"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  update("lowStockThreshold", Number(e.target.value) || 0)
                }
                style={textInputStyle()}
                placeholder="e.g. 3 (show low stock alert when quantity <= 3)"
              />
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small sub components ---------------- */

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <span style={fieldLabelStyle()}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 36,
            height: 32,
            borderRadius: 8,
            border: "1px solid rgba(148,122,173,0.5)",
            padding: 0,
            background: "transparent",
            cursor: "pointer",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...textInputStyle(),
            flex: 1,
          }}
          placeholder="#7c51a1"
        />
      </div>
    </div>
  );
}

function ToggleRow({ checked, onChange, label, description }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        fontSize: 12,
        color: "#4f3d5c",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          marginTop: 3,
          width: 16,
          height: 16,
          cursor: "pointer",
        }}
      />
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {description && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: "#7a6989",
            }}
          >
            {description}
          </div>
        )}
      </div>
    </label>
  );
}
