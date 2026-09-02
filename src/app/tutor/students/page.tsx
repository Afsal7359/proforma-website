import Link from "next/link";
import { requireTutor } from "@/lib/guards";
import { listClients } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { Person, StatusPill } from "@/components/panel/bits";
import { fmtDate, inr, overallScore } from "@/lib/format";

export const metadata = { title: "My Athletes · Proforma Co" };

export default async function TutorStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await requireTutor();
  const params = await searchParams;

  const students = await listClients({
    tutorId: session.tutorId,
    search: params.q,
    status: params.status,
  });

  return (
    <>
      <PageHead
        title="My athletes"
        subtitle="Everyone on your roster. Open an athlete to log sessions, record scores and assign training."
      />

      <div className="card">
        <form className="toolbar" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search by name, city, phone or position…"
            defaultValue={params.q ?? ""}
          />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="paused">Paused</option>
            <option value="alumni">Alumni</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">
            Filter
          </button>
          {(params.q || params.status) && (
            <Link href="/tutor/students" className="btn btn-ghost btn-sm">
              Clear
            </Link>
          )}
        </form>

        {students.length === 0 ? (
          <EmptyState
            icon="users"
            title={params.q || params.status ? "No matches" : "No athletes assigned"}
            text={
              params.q || params.status
                ? "Try a different search or clear the filters."
                : "An admin assigns athletes to your roster from the admin panel."
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Membership</th>
                  <th className="num">Form</th>
                  <th className="num">Last scored</th>
                  <th className="num">Paid</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/tutor/students/${s.id}`} className="rowlink">
                        <Person
                          name={s.full_name}
                          meta={[
                            s.city,
                            s.age ? `${s.age}y` : null,
                            s.phone,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        />
                      </Link>
                    </td>
                    <td>{s.position ?? "—"}</td>
                    <td>
                      <StatusPill value={s.status} />
                    </td>
                    <td>
                      <StatusPill value={s.subscription_status} />
                    </td>
                    <td className="num strong">{overallScore(s) ?? "—"}</td>
                    <td className="num small muted nowrap">
                      {s.last_progress_on ? fmtDate(s.last_progress_on) : "Never"}
                    </td>
                    <td className="num">{inr(s.total_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
