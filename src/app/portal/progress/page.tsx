import { requireClient } from "@/lib/guards";
import { getClientDossier } from "@/lib/queries";
import { PageHead, EmptyState, StatCard } from "@/components/panel/PanelShell";
import { MetricBars, ScoreRing } from "@/components/panel/bits";
import { fmtDate, overallScore } from "@/lib/format";
import { METRIC_KEYS } from "@/lib/types";

export const metadata = { title: "Progress · Proforma Co" };

export default async function PortalProgressPage() {
  const session = await requireClient();
  if (!session.clientId) return null;

  const { progress, client } = await getClientDossier(session.clientId);
  const latest = progress[0];
  const baseline = progress[progress.length - 1];

  const metrics = {
    speed: latest?.speed ?? null,
    stamina: latest?.stamina ?? null,
    technique: latest?.technique ?? null,
    strength: latest?.strength ?? null,
    agility: latest?.agility ?? null,
  };

  const now = overallScore(metrics);
  const then = baseline ? overallScore(baseline) : null;
  const gain = now !== null && then !== null ? now - then : null;

  return (
    <>
      <PageHead
        title="Performance tracking"
        subtitle="Five metrics, one number that moves — scored from your submitted drills and updated after every review."
      />

      {progress.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="trending-up"
            title="No scores recorded yet"
            text="Your coach records your first benchmark after the assessment call. From there it updates after every reviewed session."
          />
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Current Form"
              value={now ?? "—"}
              detail={`Scored ${fmtDate(latest.recorded_on)}`}
              icon="activity"
              accent="blue"
            />
            <StatCard
              label="Since Baseline"
              value={gain === null ? "—" : `${gain > 0 ? "+" : ""}${gain}`}
              detail={
                baseline ? `Baseline ${then} on ${fmtDate(baseline.recorded_on)}` : "—"
              }
              icon="trending-up"
              accent={gain !== null && gain >= 0 ? "green" : "gold"}
            />
            <StatCard
              label="Reviews"
              value={progress.length}
              detail="Scored assessments on file"
              icon="clipboard"
            />
            <StatCard
              label="Body"
              value={
                client?.weight_kg ? `${client.weight_kg} kg` : "—"
              }
              detail={client?.height_cm ? `${client.height_cm} cm` : "Not recorded"}
              icon="scale"
            />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <div>
                  <h2>Current profile</h2>
                  <span className="cap">
                    Scored out of 100 after {fmtDate(latest.recorded_on)}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    gap: 26,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <ScoreRing metrics={metrics} />
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <MetricBars metrics={metrics} />
                  </div>
                </div>
                {latest.notes && (
                  <p className="small muted mt-24">{latest.notes}</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h2>Score history</h2>
                <span className="cap">Most recent first</span>
              </div>
              <div className="table-wrap">
                <table className="data" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {METRIC_KEYS.map((k) => (
                        <th key={k} style={{ textTransform: "capitalize" }}>
                          {k.slice(0, 4)}
                        </th>
                      ))}
                      <th className="num">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((p) => (
                      <tr key={p.id}>
                        <td className="nowrap strong">{fmtDate(p.recorded_on)}</td>
                        {METRIC_KEYS.map((k) => (
                          <td key={k} className="num">
                            {p[k] ?? "—"}
                          </td>
                        ))}
                        <td className="num strong">{overallScore(p) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
