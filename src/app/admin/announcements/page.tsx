import { requireAdmin } from "@/lib/guards";
import { listAllAnnouncements } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import { Field, Select, TextArea, Checkbox } from "@/components/Fields";
import {
  saveAnnouncementAction,
  deleteAnnouncementAction,
} from "@/app/actions/cms";
import { fmtDateTime, titleCase } from "@/lib/format";

export const metadata = { title: "Announcements · Proforma Co" };

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "clients", label: "Athletes only" },
  { value: "tutors", label: "Coaches only" },
];

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await listAllAnnouncements();

  return (
    <>
      <PageHead
        title="Announcements"
        subtitle="Notices shown on the dashboard inside the athlete portal and coach panel."
      />

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Posted notices</h2>
            <span className="cap">{announcements.length} total</span>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              icon="megaphone"
              title="Nothing posted"
              text="Post a notice and it appears on the dashboard of everyone in the chosen audience."
            />
          ) : (
            <div className="card-body">
              <div className="stack">
                {announcements.map((a) => (
                  <details key={a.id} className="note-item">
                    <summary
                      style={{ cursor: "pointer", listStyle: "none" }}
                      className="flex-between"
                    >
                      <div>
                        <h4>{a.title}</h4>
                        <p className="small muted">
                          {titleCase(a.audience)} · {fmtDateTime(a.created_at)}
                        </p>
                      </div>
                      {a.is_published ? (
                        <span className="pill pill-green">Live</span>
                      ) : (
                        <span className="pill pill-grey">Draft</span>
                      )}
                    </summary>

                    <div style={{ marginTop: 18 }}>
                      <ActionForm
                        action={saveAnnouncementAction}
                        submitLabel="Save Notice"
                        hidden={{ id: a.id }}
                        footer={
                          <InlineAction
                            action={deleteAnnouncementAction}
                            label="Delete"
                            icon="trash"
                            className="btn btn-danger btn-sm"
                            hidden={{ id: a.id }}
                            confirm={`Delete "${a.title}"?`}
                          />
                        }
                      >
                        <Field
                          name="title"
                          label="Title"
                          required
                          defaultValue={a.title}
                        />
                        <TextArea
                          name="body"
                          label="Message"
                          rows={4}
                          defaultValue={a.body}
                        />
                        <Select
                          name="audience"
                          label="Audience"
                          options={AUDIENCE_OPTIONS}
                          defaultValue={a.audience}
                        />
                        <Checkbox
                          name="is_published"
                          label="Published"
                          defaultChecked={a.is_published}
                        />
                      </ActionForm>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Post a notice</h2>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveAnnouncementAction}
              submitLabel="Post Notice"
              resetOnSuccess
            >
              <Field
                name="title"
                label="Title"
                required
                placeholder="New trial city: Kochi, Oct 11"
              />
              <TextArea
                name="body"
                label="Message"
                rows={4}
                placeholder="Registration opens Monday. 24 slots, U-14 to U-19."
              />
              <Select
                name="audience"
                label="Audience"
                options={AUDIENCE_OPTIONS}
                defaultValue="all"
              />
              <Checkbox name="is_published" label="Publish now" defaultChecked />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
