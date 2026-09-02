import { AuthShell } from "@/components/AuthShell";
import { requireAnyUser } from "@/lib/guards";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Set Your Password · Proforma Co" };

export default async function ChangePasswordPage() {
  const session = await requireAnyUser();

  return (
    <AuthShell
      asideTitle="Set a password only you know"
      asideText="The password you were sent on WhatsApp was generated for you. Replace it with your own before you carry on."
      asidePoints={[
        "At least 8 characters, with a letter and a number",
        "Your old generated password stops working immediately",
        "Your coach can never see the password you choose",
      ]}
    >
      <h1>
        {session.mustChangePassword ? "Set your password" : "Change password"}
      </h1>
      <p className="lede">
        Signed in as <strong>{session.name}</strong> ({session.loginId})
      </p>
      <ChangePasswordForm forced={session.mustChangePassword} />
    </AuthShell>
  );
}
