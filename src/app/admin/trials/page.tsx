import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listTrials } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { ActionForm } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  Checkbox,
  TRIAL_STATUS_OPTIONS,
} from "@/components/Fields";
import { saveTrialAction } from "@/app/actions/cms";
import { Alert } from "@/components/Alert";
import { fmtDate, relativeDays } from "@/lib/format";

export const metadata = { title: "Trials · Proforma Co" };

const TAG_OPTIONS = [
  { value: "Open Trial", label: "Open Trial" },
  { value: "Academy Partner", label: "Academy Partner" },
  { value: "Invite Only", label: "Invite Only" },
  { value: "Showcase", label: "Showcase" },
];

export default async function AdminTrialsPage() {
  await requireAdmin();
  const trials = await listTrials();

  const today = new Date(new Date().toDateString());
  const upcoming = trials.filter((t) => new Date(t.trial_date) >= today);
  const past = trials.filter((t) => new Date(t.trial_date) < today);
  const totalSlots = upcoming.reduce((a, t) => a + t.total_slots, 0);
  const takenSlots = upcoming.reduce(
    (a, t) => a + (t.total_slots - t.slots_left),
    0,
  );

  return (
    <>
      <PageHead
        title="Trials"
        subtitle="The pan-India calendar. Athletes only see these after logging in to the portal."
      />

      <Alert kind="info">
        Trials never appear on the public homepage. Visitors see a locked panel
        that sends them to the login screen — only signed-in athletes get the
        live calendar and slot booking.
      </Alert>

      <div className="stat-grid">
        <StatCard label="Upcoming Trials" value={upcoming.length} icon="calendar" accent="blue" />
        <StatCard
          label="Slots Booked"
          value={`${takenSlots} / ${totalSlots}`}
          detail="Across upcoming trials"
          icon="users"
          accent="green"
        />
        <StatCard
          label="Published"
          value={trials.filter((t) => t.is_published).length}
          detail={`${trials.filter((t) => !t.is_published).length} hidden`}
          icon="eye"
        />
        <StatCard label="Completed" value={past.length} icon="check-circle" />
      </div>

      <div className="grid-2 wide-left">
        <div>
          <div className="card">
            <div className="card-head">
              <h2>Upcoming</h2>
              <span className="cap">{upcoming.length} scheduled</span>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No upcoming trials"
                text="Add one on the right and it appears in every athlete's portal."
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Date</th>
                      <th>Age group</th>
                      <th>Type</th>
                      <th className="num">Slots</th>
                      <th>Status</th>
                      <th>Live</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link href={`/admin/trials/${t.id}`} className="rowlink">
                            {t.city}
                            {t.state ? `, ${t.state}` : ""}
                          </Link>
                          {t.venue && <div className="small muted">{t.venue}</div>}
                        </td>
                        <td className="nowrap">
                          {fmtDate(t.trial_date)}
                          <div className="small muted">
                            {relativeDays(t.trial_date)}
                          </div>
                        </td>
                        <td>{t.age_group ?? "—"}</td>
                        <td>
                          <span
                            className={`tag ${
                              t.tag === "Academy Partner" ? "tag-gold" : "tag-blue"
                            }`}
                          >
                            {t.tag}
                          </span>
                        </td>
                        <td className="num strong">
                          {t.slots_left}/{t.total_slots}
                        </td>
                        <td>
                          <StatusPill value={t.status} />
                        </td>
                        <td>
                          {t.is_published ? (
                            <span className="pill pill-green">Live</span>
                          ) : (
                            <span className="pill pill-grey">Hidden</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>Past trials</h2>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Date</th>
                      <th className="num">Attended</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link href={`/admin/trials/${t.id}`} className="rowlink">
                            {t.city}
                            {t.state ? `, ${t.state}` : ""}
                          </Link>
                        </td>
                        <td className="nowrap">{fmtDate(t.trial_date)}</td>
                        <td className="num">{t.total_slots - t.slots_left}</td>
                        <td>
                          <StatusPill value={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Add a trial</h2>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveTrialAction}
              submitLabel="Add Trial"
              resetOnSuccess
            >
              <Row>
                <Field name="city" label="City" required placeholder="Mumbai" />
                <Field name="state" label="State" placeholder="Maharashtra" />
              </Row>
              <Row>
                <Field name="trial_date" label="Date" type="date" required />
                <Field
                  name="trial_time"
                  label="Time"
                  placeholder="7:00 AM — 11:00 AM"
                />
              </Row>
              <Row>
                <Field
                  name="age_group"
                  label="Age group"
                  placeholder="U-14 to U-19"
                />
                <Select
                  name="tag"
                  label="Type"
                  options={TAG_OPTIONS}
                  defaultValue="Open Trial"
                />
              </Row>
              <Row cols={3}>
                <Field
                  name="total_slots"
                  label="Total slots"
                  type="number"
                  min={0}
                  defaultValue={20}
                  required
                />
                <Field
                  name="slots_left"
                  label="Slots left"
                  type="number"
                  min={0}
                  hint="Defaults to total."
                />
                <Select
                  name="status"
                  label="Status"
                  options={TRIAL_STATUS_OPTIONS}
                  defaultValue="open"
                />
              </Row>
              <Field
                name="venue"
                label="Venue"
                placeholder="Cooperage Ground"
              />
              <TextArea name="address" label="Address" rows={2} />
              <TextArea
                name="description"
                label="Description"
                rows={2}
                placeholder="Scouted open trial with our Mumbai partner academy."
              />
              <TextArea
                name="requirements"
                label="What to bring"
                rows={2}
                placeholder="Boots, shin pads, water. Report 30 minutes early."
              />
              <Field
                name="sort_order"
                label="Sort order"
                type="number"
                defaultValue={0}
              />
              <Checkbox
                name="is_published"
                label="Publish to the athlete portal"
                defaultChecked
              />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
