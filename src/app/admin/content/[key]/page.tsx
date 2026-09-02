import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getSiteContent } from "@/lib/content";
import { PageHead } from "@/components/panel/PanelShell";
import { SectionEditor } from "@/components/panel/SectionEditor";
import { Alert } from "@/components/Alert";
import { DEFAULT_CONTENT, SECTION_LABELS } from "@/lib/default-content";

export default async function AdminContentSectionPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;

  if (!(key in DEFAULT_CONTENT)) notFound();

  const content = await getSiteContent();
  const section = content[key as keyof typeof content];
  const label = SECTION_LABELS[key as keyof typeof SECTION_LABELS];

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: "Site Content", href: "/admin/content" },
          { label },
        ]}
        title={label}
        subtitle="Edit the copy, add or remove list items, then publish."
        actions={
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm">
            Preview Site
          </Link>
        }
      />

      {(key === "plans" || key === "videos") && (
        <Alert kind="info">
          {key === "plans"
            ? "Prices, features and badges live under Plans & Pricing — this section only controls the heading and billing-toggle labels."
            : "The videos themselves live under Video Library — this section only controls the heading."}
        </Alert>
      )}

      <SectionEditor
        sectionKey={key}
        label={label}
        initial={section as unknown as Parameters<typeof SectionEditor>[0]["initial"]}
      />
    </>
  );
}
