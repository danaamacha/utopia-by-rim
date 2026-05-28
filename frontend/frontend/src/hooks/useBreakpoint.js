import { useEffect, useState } from "react";

/** Returns flags for viewport width:
 * xs <480, sm 480–767, md 768–1023, lg 1024–1279, xl ≥1280
 */
export default function useBreakpoint() {
  const calc = () => {
    const w = window.innerWidth;
    return {
      xs: w < 480,
      sm: w >= 480 && w < 768,
      md: w >= 768 && w < 1024,
      lg: w >= 1024 && w < 1280,
      xl: w >= 1280,
      width: w,
    };
  };
  const [bp, setBp] = useState(calc);

  useEffect(() => {
    const onResize = () => setBp(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}
