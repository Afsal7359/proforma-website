import { requireClient } from "@/lib/guards";
import { getSupabase } from "@/lib/supabase";
import { listTrials } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { StatusPill } from "@/components/panel/bits";
import { InlineAction } from "@/components/panel/ActionForm";
import {
  reserveTrialSlotAction,
  cancelRegistrationAction,
} from "@/app/actions/coaching";
import { fmtDate, relativeDays } from "@/lib/format";
import { Icon } from "@/components/Icon";
import type { Trial, TrialRegistration } from "@/lib/types";

export const metadata = { title: "Trials · Proforma Co" };

export default async function PortalTrialsPage() {
  const session = await requireClient();

  const [trials, regs] = await Promise.all([
    listTrials({ publishedOnly: true }),
    session.clientId
      ? getSupabase()
          .from("trial_registrations")
          .select("*, trial:trials(*)")
          .eq("client_id", session.clientId)
          .order("created_at", { ascending: false })
          .then(
            (r) => (r.data ?? []) as (TrialRegistration & { trial: Trial | null })[],
          )
      : Promise.resolve([] as (TrialRegistration & { trial: Trial | null })[]),
  ]);

  const byTrial = new Map(regs.map((r) => [r.trial_id, r]));
  const today = new Date(new Date().toDateString());

  const upcoming = trials.filter(
    (t) => new Date(t.trial_date) >= today && t.status !== "cancelled",
  );
  const past = trials.filter((t) => new Date(t.trial_date) < today);

  return (
    <>
      <PageHead
        title="Trial calendar"
        subtitle="Scouted open trials across India. Reserve a slot and your coach confirms it — every result is scored by the panel and lands in your profile."
      />

      {/* ── my registrations ── */}
      {regs.filter((r) => r.status !== "cancelled").length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Your reservations</h2>
            <span className="cap">
              Status is updated by the coaching panel after each trial
            </span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Trial</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Panel notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {regs
                  .filter((r) => r.status !== "cancelled")
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="strong">
                        {r.trial?.city ?? "—"}
                        {r.trial?.state ? `, ${r.trial.state}` : ""}
                      </td>
                      <td className="nowrap">{fmtDate(r.trial?.trial_date)}</td>
                      <td>
                        <StatusPill value={r.status} />
                      </td>
                      <td className="small muted">{r.coach_notes ?? "—"}</td>
                      <td className="actions">
                        {["registered", "confirmed"].includes(r.status) && (
                          <InlineAction
                            action={cancelRegistrationAction}
                            label="Cancel"
                            hidden={{ id: r.id }}
                            confirm="Cancel this reservation? Your slot goes back to the pool."
                          />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── open trials ── */}
      <div className="card">
        <div className="card-head">
          <h2>Open trials</h2>
          <span className="cap">{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No trials scheduled right now"
            text="New cities are added every month based on registration demand. You'll see them here first."
          />
        ) : (
          <div className="card-body">
            <div className="trial-list">
              {upcoming.map((t) => {
                const reg = byTrial.get(t.id);
                const booked = reg && reg.status !== "cancelled";
                const full = t.slots_left <= 0;
                const closed = t.status === "closed";

                return (
                  <div className="trial-card card-surface portal-trial" key={t.id}>
                    <div className="trial-top">
                      <div className="trial-main">
                        <span className="trial-city">
                          {t.city}
                          {t.state ? `, ${t.state}` : ""}
                        </span>
                        <div className="trial-meta">
                          {t.age_group && (
                            <span>
                              Age <strong>{t.age_group}</strong>
                            </span>
                          )}
                          <span>
                            Date <strong>{fmtDate(t.trial_date)}</strong>
                          </span>
                          {t.trial_time && (
                            <span>
                              Time <strong>{t.trial_time}</strong>
                            </span>
                          )}
                          <span>{relativeDays(t.trial_date)}</span>
                        </div>
                        {t.venue && <span className="venue">{t.venue}</span>}
                      </div>
                      <span
                        className={`tag ${
                          t.tag === "Academy Partner" ? "tag-gold" : "tag-blue"
                        }`}
                      >
                        {t.tag}
                      </span>
                    </div>

                    {t.description && (
                      <p className="small muted" style={{ margin: "-4px 0 0" }}>
                        {t.description}
                      </p>
                    )}
                    {t.requirements && (
                      <p className="small muted" style={{ margin: "-8px 0 0" }}>
                        <Icon
                          name="info"
                          width={13}
                          height={13}
                          style={{ display: "inline", verticalAlign: -2, marginRight: 5 }}
                        />
                        {t.requirements}
                      </p>
                    )}

                    <div className="trial-bottom">
                      <div className="trial-slots">
                        <b>{t.slots_left}</b>
                        slots left of {t.total_slots}
                      </div>

                      {booked ? (
                        <span className="pill pill-green">
                          {reg!.status.replace(/_/g, " ")}
                        </span>
                      ) : closed ? (
                        <span className="pill pill-grey">Registration closed</span>
                      ) : full ? (
                        <span className="pill pill-red">Full</span>
                      ) : (
                        <InlineAction
                          action={reserveTrialSlotAction}
                          label="Reserve Slot"
                          hidden={{ trial_id: t.id }}
                          className="btn btn-primary btn-sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── past trials ── */}
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
                  <th>Age group</th>
                  <th>Your result</th>
                </tr>
              </thead>
              <tbody>
                {past.map((t) => {
                  const reg = byTrial.get(t.id);
                  return (
                    <tr key={t.id}>
                      <td className="strong">
                        {t.city}
                        {t.state ? `, ${t.state}` : ""}
                      </td>
                      <td className="nowrap">{fmtDate(t.trial_date)}</td>
                      <td>{t.age_group ?? "—"}</td>
                      <td>
                        {reg ? (
                          <StatusPill value={reg.status} />
                        ) : (
                          <span className="small muted">Didn&apos;t attend</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
