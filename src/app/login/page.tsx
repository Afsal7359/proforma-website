import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getSession, homeFor } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log In · Proforma Co" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session) {
    redirect(session.mustChangePassword ? "/change-password" : homeFor(session.role));
  }

  return (
    <AuthShell
      asideTitle="Your trial calendar lives behind this login"
      asideText="Athletes, coaches and staff all sign in here. Your login ID is created by the Proforma Co team and sent to you on WhatsApp."
      asidePoints={[
        "Live pan-India trial calendar and slot booking",
        "Your training plan, session log and coach notes",
        "Speed, stamina, technique, strength and agility scores",
        "Payment history and subscription status",
      ]}
    >
      <LoginForm
        next={params.next}
        forbidden={params.error === "forbidden"}
      />
    </AuthShell>
  );
}
