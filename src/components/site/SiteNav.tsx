"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteContent } from "@/lib/default-content";

const SECTION_IDS = [
  "trials",
  "training",
  "career",
  "nutrition",
  "tracking",
  "plans",
  "videos",
];

export function SiteNav({
  brand,
  links,
}: {
  brand: SiteContent["brand"];
  links: SiteContent["nav"]["links"];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // Nav shrinks + gains a shadow past 10px, exactly as the original.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  // Underline the link for whichever section owns the middle of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  // Lock the page behind the full-screen mobile menu.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`nav${scrolled ? " is-scrolled" : ""}`} id="siteNav">
        <div className="container">
          <a href="#top" className="brand" aria-label={`${brand.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={36} height={36} />
            <span className="brand-text">
              <span className="name">{brand.name}</span>
              <span className="sub">{brand.sub}</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                className={active && l.href === `#${active}` ? "is-active" : ""}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <Link href="/login" className="btn btn-primary btn-sm nav-cta">
            {brand.navCtaLabel}
          </Link>

          <button
            className={`nav-burger${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? " is-open" : ""}`} id="mobileMenu">
        {links.map((l) => (
          <a
            key={l.href + l.label}
            href={l.href}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </a>
        ))}
        <Link
          href="/login"
          className="btn btn-primary btn-block"
          onClick={() => setMenuOpen(false)}
        >
          {brand.navCtaLabel}
        </Link>
      </div>
    </>
  );
}
