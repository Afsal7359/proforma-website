import { requireClient } from "@/lib/guards";
import { PanelShell } from "@/components/panel/PanelShell";
import type { NavItem } from "@/components/panel/PanelNav";

export const metadata = { title: "Athlete Portal · Proforma Co" };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { group: "My Pathway" },
  { href: "/portal", label: "Dashboard", icon: "grid", exact: true },
  { href: "/portal/trials", label: "Trials", icon: "calendar" },
  { href: "/portal/training", label: "My Training", icon: "clipboard" },
  { href: "/portal/progress", label: "Progress", icon: "trending-up" },
  { group: "Account" },
  { href: "/portal/payments", label: "Payments", icon: "rupee" },
  { href: "/portal/library", label: "Session Library", icon: "video" },
  { href: "/portal/profile", label: "My Profile", icon: "user" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireClient();
  return (
    <PanelShell session={session} nav={NAV}>
      {children}
    </PanelShell>
  );
}
