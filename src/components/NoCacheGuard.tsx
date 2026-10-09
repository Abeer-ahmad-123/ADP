"use client";

import { useEffect } from "react";

export default function NoCacheGuard() {
  useEffect(() => {
    const reloadAfterHistoryNavigation = () => {
      window.location.reload();
    };
    const reloadAfterPageRestore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", reloadAfterPageRestore);
    window.addEventListener("popstate", reloadAfterHistoryNavigation);

    return () => {
      window.removeEventListener("pageshow", reloadAfterPageRestore);
      window.removeEventListener("popstate", reloadAfterHistoryNavigation);
    };
  }, []);

  return null;
}
