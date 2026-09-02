import { Icon } from "@/components/Icon";

const ICONS = {
  error: "alert",
  success: "check-circle",
  info: "info",
  warn: "alert",
} as const;

export function Alert({
  kind,
  children,
}: {
  kind: keyof typeof ICONS;
  children: React.ReactNode;
}) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : undefined}>
      <Icon name={ICONS[kind]} />
      <div>{children}</div>
    </div>
  );
}
