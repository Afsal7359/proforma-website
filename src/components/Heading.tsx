import { Fragment } from "react";
import { parseHeading } from "@/lib/format";

/**
 * Renders a CMS heading string, turning `**text**` into the design's blue
 * accent (`<em>` on section titles, `.line-accent` in the hero) and `\n`
 * into a line break.
 */
export function Heading({
  text,
  accentTag = "em",
}: {
  text: string;
  accentTag?: "em" | "span";
}) {
  const runs = parseHeading(text ?? "");
  return (
    <>
      {runs.map((run, i) => {
        if (run.br) return <br key={i} />;
        if (!run.accent) return <Fragment key={i}>{run.text}</Fragment>;
        return accentTag === "em" ? (
          <em key={i}>{run.text}</em>
        ) : (
          <span key={i} className="line-accent">
            {run.text}
          </span>
        );
      })}
    </>
  );
}
