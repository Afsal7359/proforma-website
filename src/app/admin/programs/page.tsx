import { requireAdmin } from "@/lib/guards";
import { listPrograms } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  Checkbox,
  POSITION_OPTIONS,
} from "@/components/Fields";
import { saveProgramAction, deleteProgramAction } from "@/app/actions/coaching";

export const metadata = { title: "Programmes · Proforma Co" };

export default async function AdminProgramsPage() {
  await requireAdmin();
  const programs = await listPrograms();

  return (
    <>
      <PageHead
        title="Training programmes"
        subtitle="Reusable blocks any coach can assign, so a 12-week plan doesn't get rebuilt from scratch each time."
      />

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Programme library</h2>
            <span className="cap">{programs.length} on file</span>
          </div>

          {programs.length === 0 ? (
            <EmptyState
              icon="layout"
              title="No programmes yet"
              text="Create one and it becomes selectable when a coach assigns training."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th>Position</th>
                    <th>Level</th>
                    <th className="num">Weeks</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="strong">{p.title}</span>
                        {p.description && (
                          <div className="small muted">{p.description}</div>
                        )}
                        {p.focus_areas?.length ? (
                          <div className="small muted">
                            {p.focus_areas.join(" · ")}
                          </div>
                        ) : null}
                      </td>
                      <td>{p.position ?? "Any"}</td>
                      <td>{p.level ?? "—"}</td>
                      <td className="num">{p.weeks ?? "—"}</td>
                      <td className="actions">
                        <InlineAction
                          action={deleteProgramAction}
                          label="Remove"
                          hidden={{ id: p.id }}
                          confirm={`Remove "${p.title}"?`}
                        />
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
            <h2>New programme</h2>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveProgramAction}
              submitLabel="Create Programme"
              resetOnSuccess
            >
              <Field
                name="title"
                label="Title"
                required
                placeholder="12-Week Striker Block"
              />
              <Row cols={3}>
                <Select
                  name="position"
                  label="Position"
                  options={POSITION_OPTIONS}
                  placeholder="Any"
                />
                <Field name="level" label="Level" placeholder="Intermediate" />
                <Field
                  name="weeks"
                  label="Weeks"
                  type="number"
                  min={1}
                  max={52}
                  defaultValue={12}
                />
              </Row>
              <TextArea name="description" label="Description" rows={3} />
              <TextArea
                name="focus_areas"
                label="Focus areas"
                rows={3}
                hint="One per line."
              />
              <Checkbox
                name="is_template"
                label="Reusable template"
                defaultChecked
              />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
