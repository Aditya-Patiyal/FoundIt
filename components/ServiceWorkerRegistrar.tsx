"use client";

import { useEffect } from "react";

// Registers the service worker so the app is installable as a PWA.
// Kept tiny on purpose (README §2: no over-engineering). Real offline
// caching strategy is a Step 8 (polish) concern.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // avoid caching headaches in dev
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: the app still works without the SW, it just isn't installable.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
