// frontend/src/components/BestSellerCard.jsx
import React, { useState } from "react";
import { shadows } from "../theme";

// Intl formatter for US Dollars ($)
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function BestSellerCard({ image, name, price }) {
  const [hoverImg, setHoverImg] = useState(false);

  // Coerce price to a number if it's a numeric string; otherwise leave as-is
  const numericPrice =
    typeof price === "number"
      ? price
      : Number.isNaN(Number(price))
      ? null
      : Number(price);

  const displayPrice =
    numericPrice === null ? String(price) : usd.format(numericPrice);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f8f5fa 100%)",
        border: "1px solid rgba(212,175,55,0.35)", // soft gold border
        borderRadius: 20,
        padding: "20px",
        textAlign: "center",
        boxShadow: shadows.subtle,
        transition: "transform .35s ease, box-shadow .35s ease",
        transform: "translateY(0)",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,175,55,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = shadows.subtle;
      }}
    >
      {/* Rectangle image with zoom */}
      <div
        onMouseEnter={() => setHoverImg(true)}
        onMouseLeave={() => setHoverImg(false)}
        style={{
          width: "100%",
          height: 240,
          marginBottom: 18,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,.15)",
        }}
      >
        <img
          src={image}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hoverImg ? "scale(1.07)" : "scale(1)",
            transition: "transform .45s ease",
            display: "block",
          }}
          loading="lazy"
        />
      </div>

      {/* Product name */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          margin: "0 0 8px",
          color: "#4b3355",
        }}
      >
        {name}
      </h3>

      {/* Price in USD */}
      <p
        style={{
          margin: 0,
          fontSize: 16,
          color: "#7b6882",
          fontWeight: 600,
          letterSpacing: 0.2,
        }}
      >
        {displayPrice}
      </p>

      {/* Add to Cart */}
      <button
        type="button"
        style={{
          marginTop: 18,
          background: "linear-gradient(90deg, #d4af37, #f6d77e)",
          border: "none",
          color: "#fff",
          fontWeight: 600,
          padding: "10px 24px",
          borderRadius: 30,
          cursor: "pointer",
          transition: "opacity .25s ease, transform .2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label={`Add ${name} to cart`}
      >
        Add to Cart
      </button>
    </div>
  );
}
