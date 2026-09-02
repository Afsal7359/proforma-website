import { requireClient } from "@/lib/guards";
import { listVideos } from "@/lib/queries";
import { PageHead, EmptyState } from "@/components/panel/PanelShell";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Session Library · Proforma Co" };

export default async function PortalLibraryPage() {
  await requireClient();
  const videos = await listVideos();

  return (
    <>
      <PageHead
        title="Session library"
        subtitle="Every live session is recorded. Rewatch technique breakdowns, match analysis and recovery routines whenever you need them."
      />

      {videos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="video"
            title="Library is empty"
            text="Recorded sessions are published here as they're added."
          />
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v) => {
            const card = (
              <>
                <div
                  className="video-thumb"
                  style={
                    v.thumbnail_url
                      ? { backgroundImage: `url('${v.thumbnail_url}')` }
                      : undefined
                  }
                >
                  {v.category && (
                    <span className="video-tag tag tag-blue">{v.category}</span>
                  )}
                  {v.is_new && <span className="video-new">New</span>}
                  <div className="play">
                    <Icon name="play" />
                  </div>
                  {v.duration_min != null && (
                    <span className="video-dur">{v.duration_min} min</span>
                  )}
                </div>
                <div className="video-info">
                  <h4>{v.title}</h4>
                  <span>
                    {[v.category, v.duration_min ? `${v.duration_min} min` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </>
            );

            return v.video_url ? (
              <a
                className="video-card"
                key={v.id}
                href={v.video_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {card}
              </a>
            ) : (
              <div className="video-card" key={v.id}>
                {card}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
