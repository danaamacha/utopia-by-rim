import React from "react";
import { colors, radii } from "../theme";
export default function Contact(){
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: colors.deepViolet, marginTop: 0 }}>Contact</h1>
      <div style={{ display:"grid", gap:12, maxWidth: 520 }}>
        <input placeholder="Your name" style={{ padding:"12px 14px", border:`1px solid ${colors.pearlGray}`, borderRadius:radii.sm, outline:"none" }}/>
        <input placeholder="Email or phone" style={{ padding:"12px 14px", border:`1px solid ${colors.pearlGray}`, borderRadius:radii.sm, outline:"none" }}/>
        <textarea placeholder="Your message" rows={5} style={{ padding:"12px 14px", border:`1px solid ${colors.pearlGray}`, borderRadius:radii.sm, outline:"none", resize:"vertical" }}/>
        <button style={{ background: colors.royalPlum, color:"#fff", border:"none", padding:"12px 16px", borderRadius:radii.sm, cursor:"pointer" }}>
          Send (placeholder)
        </button>
      </div>
    </main>
  );
}
