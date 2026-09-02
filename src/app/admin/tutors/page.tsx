import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listTutors } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { Person } from "@/components/panel/bits";
import { ActionForm } from "@/components/panel/ActionForm";
import { Field, Row, TextArea, Checkbox } from "@/components/Fields";
import { saveTutorAction } from "@/app/actions/people";
import { Alert } from "@/components/Alert";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Coaches · Proforma Co" };

export default async function AdminTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tutors = await listTutors();

  return (
    <>
      <PageHead
        title="Coaches"
        subtitle="The coaching panel. Adding a coach generates their own login for the coach dashboard."
      />

      {params.deleted && <Alert kind="success">Coach removed.</Alert>}

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Coaching panel</h2>
            <span className="cap">{tutors.length} coaches</span>
          </div>

          {tutors.length === 0 ? (
            <EmptyState
              icon="whistle"
              title="No coaches yet"
              text="Add your first coach — they get a login for the coach dashboard where they manage their own athletes."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Coach</th>
                    <th>Specialisation</th>
                    <th className="num">Athletes</th>
                    <th>Login ID</th>
                    <th className="num">Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link href={`/admin/tutors/${t.id}`} className="rowlink">
                          <Person
                            name={t.user?.full_name ?? "Coach"}
                            meta={[t.city, t.user?.phone]
                              .filter(Boolean)
                              .join(" · ")}
                          />
                        </Link>
                      </td>
                      <td>
                        {t.specialization ?? "—"}
                        {t.positions?.length ? (
                          <div className="small muted">
                            {t.positions.join(", ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="num strong">{t.student_count}</td>
                      <td className="mono small">{t.user?.login_id ?? "—"}</td>
                      <td className="num small muted nowrap">
                        {t.user?.last_login_at
                          ? fmtDateTime(t.user.last_login_at)
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Add a coach</h2>
            <span className="cap">A login is generated automatically</span>
          </div>
          <div className="card-body">
            <ActionForm action={saveTutorAction} submitLabel="Create Coach">
              <Field name="full_name" label="Full name" required />
              <Row>
                <Field
                  name="phone"
                  label="Phone"
                  placeholder="9876543210"
                  hint="Used for the WhatsApp invite."
                />
                <Field name="email" label="Email" type="email" />
              </Row>
              <Row>
                <Field
                  name="specialization"
                  label="Specialisation"
                  placeholder="Attacking play & finishing"
                />
                <Field
                  name="experience_years"
                  label="Experience (years)"
                  type="number"
                  step="0.5"
                  min={0}
                />
              </Row>
              <Field
                name="positions"
                label="Positions coached"
                hint="Comma separated."
                placeholder="Striker, Winger, Attacking Mid"
              />
              <Row>
                <Field name="city" label="City" />
                <Field name="photo_url" label="Photo URL" type="url" />
              </Row>
              <TextArea name="bio" label="Bio" rows={3} />
              <Checkbox name="is_active" label="Active on the panel" defaultChecked />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
