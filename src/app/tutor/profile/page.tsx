import Link from "next/link";
import { requireTutor } from "@/lib/guards";
import { getTutor, tutorStats } from "@/lib/queries";
import { PageHead, StatCard } from "@/components/panel/PanelShell";
import { ActionForm } from "@/components/panel/ActionForm";
import { Field, Row, TextArea } from "@/components/Fields";
import { updateOwnTutorProfileAction } from "@/app/actions/people";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "My Profile · Proforma Co" };

export default async function TutorProfilePage() {
  const session = await requireTutor();
  const [tutor, stats] = await Promise.all([
    getTutor(session.tutorId!),
    tutorStats(session.tutorId!),
  ]);

  return (
    <>
      <PageHead
        title="My profile"
        subtitle="What athletes and admin see about you."
        actions={
          <Link href="/change-password" className="btn btn-ghost btn-sm">
            Change Password
          </Link>
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

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Coach profile</h2>
          </div>
          <div className="card-body">
            <ActionForm action={updateOwnTutorProfileAction} submitLabel="Save Profile">
              <Field
                name="specialization"
                label="Specialisation"
                defaultValue={tutor?.specialization}
                placeholder="Attacking play & finishing"
              />
              <Field
                name="positions"
                label="Positions coached"
                defaultValue={tutor?.positions?.join(", ")}
                hint="Comma separated."
                placeholder="Striker, Winger, Attacking Mid"
              />
              <Row>
                <Field name="city" label="City" defaultValue={tutor?.city} />
                <Field
                  name="photo_url"
                  label="Photo URL"
                  type="url"
                  defaultValue={tutor?.photo_url}
                />
              </Row>
              <Row>
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  defaultValue={tutor?.user?.email}
                />
                <Field
                  name="phone"
                  label="Phone"
                  defaultValue={tutor?.user?.phone}
                />
              </Row>
              <TextArea
                name="bio"
                label="Bio"
                rows={4}
                defaultValue={tutor?.bio}
                placeholder="Former state-level striker; six years coaching academy intakes."
              />
            </ActionForm>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Account</h2>
          </div>
          <div className="card-body">
            <dl className="kv">
              <div>
                <dt>Name</dt>
                <dd>{session.name}</dd>
              </div>
              <div>
                <dt>Login ID</dt>
                <dd className="mono">{session.loginId}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>
                  {tutor?.experience_years
                    ? `${tutor.experience_years} years`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Last login</dt>
                <dd>{fmtDateTime(tutor?.user?.last_login_at)}</dd>
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
    </>
  );
}
