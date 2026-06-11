import React, { useEffect, useState } from "react";

export default function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const getAboutTop = () => {
      const el = document.querySelector("#about");
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    };

    let aboutTop = getAboutTop();
    const onResize = () => { aboutTop = getAboutTop(); };
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      // If we have #about, show after passing it. Otherwise show after 500px.
      if (aboutTop !== null) {
        setShow(y > aboutTop - 120);
      } else {
        setShow(y > 500);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // initial check
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      aria-label="Scroll to top"
      onClick={scrollToTop}
      style={{
        position: "fixed",
        right: 18,
        bottom: 22,
        zIndex: 120,
        width: 46,
        height: 46,
        borderRadius: 999,
        border: "1px solid rgba(212,175,55,.6)",      // soft gold ring
        background: "linear-gradient(180deg,#ffffff,#f7f2fb)",
        color: "#3d264b",
        boxShadow: "0 10px 24px rgba(0,0,0,.18)",
        display: show ? "grid" : "none",
        placeItems: "center",
        cursor: "pointer",
        transition: "transform .18s ease, box-shadow .18s ease, opacity .18s ease",
        opacity: show ? 1 : 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 14px 30px rgba(212,175,55,.26)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,.18)";
      }}
    >
      {/* Up arrow */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
