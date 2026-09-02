import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getTutor, listClients, tutorStats } from "@/lib/queries";
import { getSupabase } from "@/lib/supabase";
import { PageHead, StatCard, EmptyState } from "@/components/panel/PanelShell";
import { Person, StatusPill } from "@/components/panel/bits";
import {
  ActionForm,
  InlineAction,
  CredentialBox,
} from "@/components/panel/ActionForm";
import { Field, Row, TextArea, Checkbox } from "@/components/Fields";
import {
  saveTutorAction,
  deleteTutorAction,
  regenerateCredentialsAction,
  toggleUserActiveAction,
} from "@/app/actions/people";
import { buildWhatsAppInvite } from "@/lib/auth";
import { fmtDate, fmtDateTime, overallScore } from "@/lib/format";

export default async function AdminTutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const tutor = await getTutor(id);
  if (!tutor) notFound();

  const [students, stats, { data: loginRow }] = await Promise.all([
    listClients({ tutorId: id }),
    tutorStats(id),
    getSupabase()
      .from("app_users")
      .select("id, initial_password, must_change_password, is_active")
      .eq("id", tutor.user_id)
      .maybeSingle(),
  ]);

  const name = tutor.user?.full_name ?? "Coach";
  const loginId = tutor.user?.login_id ?? null;

  const pendingCredential =
    loginRow?.initial_password && loginId
      ? {
          name,
          loginId,
          password: loginRow.initial_password as string,
          whatsapp: buildWhatsAppInvite({
            phone: tutor.user?.phone,
            name,
            loginId,
            password: loginRow.initial_password as string,
            role: "tutor",
            siteUrl:
              process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
              "http://localhost:3000",
          }),
        }
      : null;

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "Coaches", href: "/admin/tutors" },
          { label: name },
        ]}
        title={name}
        subtitle={
          [tutor.specialization, tutor.city, loginId]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <InlineAction
            action={deleteTutorAction}
            label="Delete"
            icon="trash"
            className="btn btn-danger btn-sm"
            hidden={{ id: tutor.id }}
            confirm={`Delete ${name}? Their athletes stay but become unassigned.`}
          />
        }
      />

      <div className="stat-grid">
        <StatCard label="Athletes" value={stats.students} icon="users" accent="blue" />
        <StatCard
          label="Active Athletes"
          value={stats.activeStudents}
          icon="check-circle"
          accent="green"
        />
        <StatCard
          label="Sessions This Week"
          value={stats.sessionsThisWeek}
          icon="clipboard"
        />
        <StatCard label="Active Plans" value={stats.activePlans} icon="layout" />
      </div>

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Assigned athletes</h2>
            <Link href="/admin/clients" className="btn btn-ghost btn-sm">
              Manage Assignments
            </Link>
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon="users"
              title="No athletes assigned"
              text="Assign athletes to this coach from an athlete's page."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Position</th>
                    <th>Membership</th>
                    <th className="num">Form</th>
                    <th className="num">Last scored</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/admin/clients/${s.id}`} className="rowlink">
                          <Person name={s.full_name} meta={s.city} />
                        </Link>
                      </td>
                      <td>{s.position ?? "—"}</td>
                      <td>
                        <StatusPill value={s.subscription_status} />
                      </td>
                      <td className="num strong">{overallScore(s) ?? "—"}</td>
                      <td className="num small muted nowrap">
                        {s.last_progress_on ? fmtDate(s.last_progress_on) : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          {pendingCredential && (
            <div className="card">
              <div className="card-body">
                <CredentialBox
                  {...pendingCredential}
                  message="Login not yet used — share it again any time"
                />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Coach login</h2>
            </div>
            <div className="card-body">
              <dl className="kv">
                <div>
                  <dt>Login ID</dt>
                  <dd className="mono">{loginId ?? "—"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {loginRow?.is_active ? (
                      <span className="pill pill-green">Active</span>
                    ) : (
                      <span className="pill pill-red">Disabled</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Password set</dt>
                  <dd>
                    {loginRow?.must_change_password
                      ? "Still the generated one"
                      : "Chosen by coach"}
                  </dd>
                </div>
                <div>
                  <dt>Last login</dt>
                  <dd>{fmtDateTime(tutor.user?.last_login_at)}</dd>
                </div>
              </dl>
            </div>
            <div className="card-foot">
              <div className="row-gap">
                <InlineAction
                  action={regenerateCredentialsAction}
                  label="Generate New Password"
                  icon="key"
                  className="btn btn-primary btn-sm"
                  hidden={{ userId: tutor.user_id }}
                  confirm="Generate a new password? The current one stops working immediately."
                />
                <InlineAction
                  action={toggleUserActiveAction}
                  label={loginRow?.is_active ? "Disable Login" : "Enable Login"}
                  hidden={{
                    userId: tutor.user_id,
                    active: loginRow?.is_active ? "false" : "true",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Edit coach</h2>
            </div>
            <div className="card-body">
              <ActionForm
                action={saveTutorAction}
                submitLabel="Save Coach"
                hidden={{ id: tutor.id }}
              >
                <Field
                  name="full_name"
                  label="Full name"
                  required
                  defaultValue={name}
                />
                <Row>
                  <Field
                    name="phone"
                    label="Phone"
                    defaultValue={tutor.user?.phone}
                  />
                  <Field
                    name="email"
                    label="Email"
                    type="email"
                    defaultValue={tutor.user?.email}
                  />
                </Row>
                <Row>
                  <Field
                    name="specialization"
                    label="Specialisation"
                    defaultValue={tutor.specialization}
                  />
                  <Field
                    name="experience_years"
                    label="Experience (years)"
                    type="number"
                    step="0.5"
                    defaultValue={tutor.experience_years}
                  />
                </Row>
                <Field
                  name="positions"
                  label="Positions coached"
                  hint="Comma separated."
                  defaultValue={tutor.positions?.join(", ")}
                />
                <Row>
                  <Field name="city" label="City" defaultValue={tutor.city} />
                  <Field
                    name="photo_url"
                    label="Photo URL"
                    type="url"
                    defaultValue={tutor.photo_url}
                  />
                </Row>
                <TextArea
                  name="bio"
                  label="Bio"
                  rows={3}
                  defaultValue={tutor.bio}
                />
                <Checkbox
                  name="is_active"
                  label="Active on the panel"
                  defaultChecked={tutor.is_active}
                />
              </ActionForm>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
