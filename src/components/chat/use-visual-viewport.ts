"use client";

import { useEffect, useState } from "react";

/**
 * Visible viewport height. Mobile keyboards shrink visualViewport without
 * resizing the layout viewport, so a 100dvh shell would push the composer off
 * screen. Returns null until the first measurement (SSR-safe).
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(Math.round(vv.height));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
