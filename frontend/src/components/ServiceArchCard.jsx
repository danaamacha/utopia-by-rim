import React from "react";
import { colors, radii, shadows } from "../theme";

export default function ServiceArchCard({ image, title, text }) {
  // fallback colors in case theme values are missing
  const borderColor = colors?.pearlGray || "#dcdcdc";
  const baseColor = colors?.midnightPurple || "#3b295b";
  const boxShadow = shadows?.subtle || "0 2px 10px rgba(0,0,0,0.15)";
  const gold = "#d4af37";

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 24,
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        transition: "transform .25s ease, box-shadow .25s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-6px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {/* --- Top image (arched) --- */}
      <div
        style={{
          height: 240,
          overflow: "hidden",
          borderTopLeftRadius: 140,
          borderTopRightRadius: 140,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          border: `1px solid ${borderColor}`,
          boxShadow: boxShadow,
          background: `url("${image}") center/cover no-repeat`,
          transition: "transform .3s ease",
        }}
      />

      {/* --- Text base --- */}
      <div
        style={{
          background: baseColor,
          color: "#fff",
          padding: "20px 18px 26px",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          border: `1px solid ${borderColor}`,
          borderTop: "none",
          boxShadow: boxShadow,
          minHeight: 160,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft gold overlay accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 6,
            background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
            opacity: 0.6,
          }}
        />

        <div
          style={{
            color: gold,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: 0.5,
            fontSize: 17,
            marginBottom: 8,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {title}
        </div>

        <p
          style={{
            margin: 0,
            lineHeight: 1.6,
            color: "#f1e9f4",
            textAlign: "center",
            fontSize: 15,
            fontFamily: "'Poppins', sans-serif",
            opacity: 0.95,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
