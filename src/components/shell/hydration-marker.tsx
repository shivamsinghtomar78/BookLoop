"use client";

// Marks the document once React has hydrated, so tests (and any future
// "tap before ready" guard) can tell the static HTML apart from a live app.

import { useEffect } from "react";

export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);
  return null;
}
