import { requireTutor } from "@/lib/guards";
import { PanelShell } from "@/components/panel/PanelShell";
import type { NavItem } from "@/components/panel/PanelNav";

export const metadata = { title: "Coach Panel · Proforma Co" };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { group: "Coaching" },
  { href: "/tutor", label: "Dashboard", icon: "grid", exact: true },
  { href: "/tutor/students", label: "My Athletes", icon: "users" },
  { href: "/tutor/sessions", label: "Session Log", icon: "clipboard" },
  { href: "/tutor/trials", label: "Trials", icon: "calendar" },
  { group: "Library" },
  { href: "/tutor/programs", label: "Programmes", icon: "layout" },
  { href: "/tutor/profile", label: "My Profile", icon: "user" },
];

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTutor();
  return (
    <PanelShell session={session} nav={NAV}>
      {children}
    </PanelShell>
  );
}
