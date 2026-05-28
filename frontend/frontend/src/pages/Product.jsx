import React from "react";
import { useParams } from "react-router-dom";
import { colors, radii, shadows } from "../theme";
import { useCart } from "../store/cartStore";

export default function Product() {
  const { id } = useParams();
  const add = useCart((s) => s.add);

  // placeholder data by id
  const map = {
    p1: { name: "Resin Coaster Set", price: 25 },
    p2: { name: "Marbled Tray", price: 40 },
    p3: { name: "Gold-Leaf Decor", price: 30 },
    p4: { name: "Personalized Name Plate", price: 35 },
  };
  const p = map[id] ?? { name: "Product", price: 0 };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div
          style={{
            height: 420,
            borderRadius: radii.lg,
            background: "#f7f6f9",
            border: `1px solid ${colors.pearlGray}`,
            boxShadow: shadows.subtle,
          }}
        />
        <div>
          <h1 style={{ marginTop: 0, color: colors.deepViolet }}>{p.name}</h1>
          <div style={{ fontSize: 22, color: colors.vividPurple }}>${p.price}</div>
          <p style={{ marginTop: 12, color: colors.smokePurple }}>
            Beautiful handmade resin piece. Details and options will appear here later.
          </p>
          <button
            onClick={() => add({ id, ...p, qty: 1 })}
            style={{
              marginTop: 12,
              background: colors.royalPlum,
              color: "#fff",
              border: "none",
              padding: "12px 16px",
              borderRadius: radii.sm,
              cursor: "pointer",
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}
