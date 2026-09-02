"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

export type NavItem =
  | { group: string }
  | { href: string; label: string; icon: string; exact?: boolean };

export function PanelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="panel-nav" aria-label="Panel">
      {items.map((item, i) => {
        if ("group" in item) {
          return (
            <span className="nav-group" key={`g-${i}`}>
              {item.group}
            </span>
          );
        }
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "is-active" : ""}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
