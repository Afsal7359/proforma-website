import { requireAdmin } from "@/lib/guards";
import { PanelShell } from "@/components/panel/PanelShell";
import type { NavItem } from "@/components/panel/PanelNav";

export const metadata = { title: "Admin · Proforma Co" };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { group: "Overview" },
  { href: "/admin", label: "Dashboard", icon: "grid", exact: true },

  { group: "People" },
  { href: "/admin/clients", label: "Athletes", icon: "users" },
  { href: "/admin/tutors", label: "Coaches", icon: "whistle" },

  { group: "Programme" },
  { href: "/admin/trials", label: "Trials", icon: "calendar" },
  { href: "/admin/programs", label: "Programmes", icon: "layout" },
  { href: "/admin/videos", label: "Video Library", icon: "video" },

  { group: "Money" },
  { href: "/admin/plans", label: "Plans & Pricing", icon: "target" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "check-circle" },
  { href: "/admin/payments", label: "Payments", icon: "rupee" },

  { group: "Website" },
  { href: "/admin/content", label: "Site Content", icon: "edit" },
  { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },

  { group: "System" },
  { href: "/admin/settings", label: "Settings & Health", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <PanelShell session={session} nav={NAV}>
      {children}
    </PanelShell>
  );
}
