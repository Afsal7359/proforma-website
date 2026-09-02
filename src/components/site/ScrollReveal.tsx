"use client";

import { useEffect } from "react";

/**
 * Fades `.reveal` elements in as they enter the viewport — the original
 * design's scroll-reveal, mounted once for the whole page.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".reveal:not(.is-visible)",
    );
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
