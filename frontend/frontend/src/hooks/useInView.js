import { useEffect, useRef, useState } from "react";

/** Returns [ref, inView] – true once the element has entered the viewport */
export default function useInView(options = { threshold: 0.15, rootMargin: "0px" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect(); // fire once
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return [ref, inView];
}
