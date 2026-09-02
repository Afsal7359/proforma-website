import { requireAdmin } from "@/lib/guards";
import { listTutors, listPlans } from "@/lib/queries";
import { PageHead } from "@/components/panel/PanelShell";
import { ClientForm } from "@/components/panel/ClientForm";
import { Alert } from "@/components/Alert";

export const metadata = { title: "Add Athlete · Proforma Co" };

export default async function AdminNewClientPage() {
  await requireAdmin();
  const [tutors, plans] = await Promise.all([listTutors(), listPlans()]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "Athletes", href: "/admin/clients" },
          { label: "Add" },
        ]}
        title="Add an athlete"
        subtitle="Create the athlete file and generate the portal login you'll send on WhatsApp."
      />

      <Alert kind="info">
        Leave <strong>Generate a portal login</strong> ticked and the login ID and
        one-time password appear right here after saving, with a one-tap WhatsApp
        invite when a phone number is set.
      </Alert>

      <div className="card">
        <div className="card-head">
          <h2>Athlete details</h2>
        </div>
        <div className="card-body">
          <ClientForm
            tutors={tutors.map((t) => ({
              id: t.id,
              name: t.user?.full_name ?? "Coach",
            }))}
            plans={plans}
          />
        </div>
      </div>
    </>
  );
}
