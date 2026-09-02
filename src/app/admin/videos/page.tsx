import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { listVideos } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import { Field, Row, TextArea, Checkbox } from "@/components/Fields";
import { saveVideoAction, deleteVideoAction } from "@/app/actions/cms";
import { Alert } from "@/components/Alert";

export const metadata = { title: "Video Library · Proforma Co" };

export default async function AdminVideosPage() {
  await requireAdmin();
  const videos = await listVideos();

  return (
    <>
      <PageHead
        title="Video library"
        subtitle="Recorded sessions. Public videos show on the homepage; every video shows inside the athlete portal."
        actions={
          <Link href="/#videos" target="_blank" className="btn btn-ghost btn-sm">
            View On Site
          </Link>
        }
      />

      <Alert kind="info">
        Untick <strong>Show on the public homepage</strong> to keep a video
        members-only — it stays visible in the athlete portal either way.
      </Alert>

      <div className="grid-2 wide-left">
        <div className="card">
          <div className="card-head">
            <h2>Library</h2>
            <span className="cap">{videos.length} videos</span>
          </div>

          {videos.length === 0 ? (
            <EmptyState
              icon="video"
              title="No videos yet"
              text="Until you add one, the homepage falls back to the original six sample cards."
            />
          ) : (
            <div className="card-body">
              <div className="stack">
                {videos.map((v) => (
                  <details key={v.id} className="note-item">
                    <summary
                      style={{ cursor: "pointer", listStyle: "none" }}
                      className="flex-between"
                    >
                      <div>
                        <h4>{v.title}</h4>
                        <p className="small muted">
                          {[
                            v.category,
                            v.duration_min ? `${v.duration_min} min` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="row-gap">
                        {v.is_new && <span className="pill pill-gold">New</span>}
                        {v.is_public ? (
                          <span className="pill pill-green">Public</span>
                        ) : (
                          <span className="pill pill-grey">Members</span>
                        )}
                      </div>
                    </summary>

                    <div style={{ marginTop: 18 }}>
                      <ActionForm
                        action={saveVideoAction}
                        submitLabel="Save Video"
                        hidden={{ id: v.id }}
                        footer={
                          <InlineAction
                            action={deleteVideoAction}
                            label="Delete"
                            icon="trash"
                            className="btn btn-danger btn-sm"
                            hidden={{ id: v.id }}
                            confirm={`Delete "${v.title}"?`}
                          />
                        }
                      >
                        <Field
                          name="title"
                          label="Title"
                          required
                          defaultValue={v.title}
                        />
                        <Row cols={3}>
                          <Field
                            name="category"
                            label="Category"
                            defaultValue={v.category}
                            placeholder="Drills"
                          />
                          <Field
                            name="duration_min"
                            label="Duration (min)"
                            type="number"
                            defaultValue={v.duration_min}
                          />
                          <Field
                            name="sort_order"
                            label="Sort order"
                            type="number"
                            defaultValue={v.sort_order}
                          />
                        </Row>
                        <Field
                          name="thumbnail_url"
                          label="Thumbnail URL"
                          type="url"
                          defaultValue={v.thumbnail_url}
                        />
                        <Field
                          name="video_url"
                          label="Video URL"
                          type="url"
                          defaultValue={v.video_url}
                        />
                        <Row>
                          <Field
                            name="position_tag"
                            label="Position tag"
                            defaultValue={v.position_tag}
                          />
                          <div />
                        </Row>
                        <TextArea
                          name="description"
                          label="Description"
                          rows={2}
                          defaultValue={v.description}
                        />
                        <Row>
                          <Checkbox
                            name="is_new"
                            label='Show the gold "New" badge'
                            defaultChecked={v.is_new}
                          />
                          <Checkbox
                            name="is_public"
                            label="Show on the public homepage"
                            defaultChecked={v.is_public}
                          />
                        </Row>
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
            <h2>Add a video</h2>
          </div>
          <div className="card-body">
            <ActionForm
              action={saveVideoAction}
              submitLabel="Add Video"
              resetOnSuccess
            >
              <Field
                name="title"
                label="Title"
                required
                placeholder="First-Touch Under Pressure"
              />
              <Row cols={3}>
                <Field name="category" label="Category" placeholder="Drills" />
                <Field
                  name="duration_min"
                  label="Duration (min)"
                  type="number"
                  min={1}
                />
                <Field
                  name="sort_order"
                  label="Sort order"
                  type="number"
                  defaultValue={videos.length + 1}
                />
              </Row>
              <Field
                name="thumbnail_url"
                label="Thumbnail URL"
                type="url"
                placeholder="https://images.unsplash.com/…"
              />
              <Field
                name="video_url"
                label="Video URL"
                type="url"
                placeholder="https://youtube.com/…"
              />
              <Field name="position_tag" label="Position tag" />
              <TextArea name="description" label="Description" rows={2} />
              <Row>
                <Checkbox name="is_new" label='Show the gold "New" badge' />
                <Checkbox
                  name="is_public"
                  label="Show on the public homepage"
                  defaultChecked
                />
              </Row>
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
