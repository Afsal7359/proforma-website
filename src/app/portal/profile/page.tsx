import Link from "next/link";
import { requireClient } from "@/lib/guards";
import { getClient } from "@/lib/queries";
import { PageHead } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { Alert } from "@/components/Alert";
import { fmtDate, fmtDateTime, titleCase } from "@/lib/format";

export const metadata = { title: "My Profile · Proforma Co" };

export default async function PortalProfilePage() {
  const session = await requireClient();
  const client = session.clientId ? await getClient(session.clientId) : null;

  return (
    <>
      <PageHead
        title="My profile"
        subtitle="What the coaching panel and partner academies see on your athlete file."
        actions={
          <Link href="/change-password" className="btn btn-ghost btn-sm">
            Change Password
          </Link>
        }
      />

      <Alert kind="info">
        Your coach maintains this file. If anything here is out of date, message
        them on WhatsApp and they&apos;ll correct it.
      </Alert>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Athlete details</h2>
          </div>
          <div className="card-body">
            <dl className="kv">
              <div>
                <dt>Name</dt>
                <dd>{client?.full_name ?? session.name}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{client?.position ?? "—"}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>
                  {client?.age ?? "—"}
                  {client?.date_of_birth
                    ? ` · born ${fmtDate(client.date_of_birth)}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Based in</dt>
                <dd>
                  {[client?.city, client?.state].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>{client?.height_cm ? `${client.height_cm} cm` : "—"}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{client?.weight_kg ? `${client.weight_kg} kg` : "—"}</dd>
              </div>
              <div>
                <dt>Goal</dt>
                <dd>{client?.goal ?? "—"}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{fmtDate(client?.joined_on)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">
              <h2>Contact</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Phone</dt>
                  <dd>{client?.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{client?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt>Guardian</dt>
                  <dd>{client?.guardian_name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Guardian phone</dt>
                  <dd>{client?.guardian_phone ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Programme</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Coach</dt>
                  <dd>{client?.tutor_name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt>Plan</dt>
                  <dd>{client?.plan_name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Membership</dt>
                  <dd>
                    <StatusPill value={client?.subscription_status} />
                  </dd>
                </div>
                <div>
                  <dt>Athlete status</dt>
                  <dd>{titleCase(client?.status)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Login</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Login ID</dt>
                  <dd className="mono">{session.loginId}</dd>
                </div>
                <div>
                  <dt>Last login</dt>
                  <dd>{fmtDateTime(client?.last_login_at)}</dd>
                </div>
              </dl>
            </div>
            <div className="card-foot">
              <Link href="/change-password" className="btn btn-ghost btn-sm">
                Change Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
