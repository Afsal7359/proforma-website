"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import {
  saveContentSectionAction,
  resetContentSectionAction,
} from "@/app/actions/cms";
import type { ActionState } from "@/lib/action-utils";

type Json = string | number | boolean | Json[] | { [k: string]: Json };

/** Keys whose copy runs long enough to want a textarea. */
const LONG_KEYS = new Set([
  "paragraph",
  "sub",
  "text",
  "quote",
  "description",
  "about",
  "note",
  "include",
  "body",
  "footnote",
  "headline",
  "gateText",
  "captionSub",
  "metricsFootnote",
  "legal",
  "title",
]);

const HINTS: Record<string, string> = {
  headline: "Wrap a word in **stars** for the blue accent. Use new lines for line breaks.",
  title: "Wrap words in **stars** to render them in the blue accent style.",
};

function humanise(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Blank item matching the shape of an existing row, so "Add" produces valid data. */
function blankLike(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(sample)) out[k] = blankLike(v);
  return out;
}

export function SectionEditor({
  sectionKey,
  label,
  initial,
}: {
  sectionKey: string;
  label: string;
  initial: Record<string, Json>;
}) {
  const [value, setValue] = useState<Record<string, Json>>(initial);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveContentSectionAction,
    null,
  );

  /** Replaces the node at `path` inside the tree. */
  function setAt(path: (string | number)[], next: Json) {
    setValue((prev) => {
      const clone = structuredClone(prev) as Record<string, Json>;
      if (path.length === 0) return next as Record<string, Json>;
      let node: Json = clone;
      for (let i = 0; i < path.length - 1; i++) {
        node = (node as Record<string, Json>)[path[i] as string];
      }
      const last = path[path.length - 1];
      if (Array.isArray(node)) node[last as number] = next;
      else (node as Record<string, Json>)[last as string] = next;
      return clone;
    });
  }

  function renderNode(
    node: Json,
    path: (string | number)[],
    key: string,
  ): React.ReactNode {
    const name = [sectionKey, ...path].join(".");

    /* ── arrays ── */
    if (Array.isArray(node)) {
      const sample = node[0];
      return (
        <fieldset
          key={name}
          style={{ border: "none", padding: 0, marginBottom: 24 }}
        >
          <legend
            className="k"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 12,
            }}
          >
            {humanise(key)} · {node.length} item{node.length === 1 ? "" : "s"}
          </legend>

          {/* An emptied list posts no fields at all, which the server would
              read as "unchanged" and restore the defaults. This marker keeps
              an empty list empty. */}
          {node.length === 0 && (
            <input type="hidden" name={name} value="" />
          )}

          <div className="repeater">
            {node.map((item, i) => (
              <div className="repeater-item" key={`${name}.${i}`}>
                <span className="idx">
                  {humanise(key).replace(/s$/, "")} {i + 1}
                </span>
                <button
                  type="button"
                  className="rm"
                  aria-label="Remove item"
                  onClick={() =>
                    setAt(
                      path,
                      node.filter((_, j) => j !== i) as Json,
                    )
                  }
                >
                  <Icon name="trash" width={14} height={14} />
                </button>

                {typeof item === "object" && item !== null && !Array.isArray(item)
                  ? Object.entries(item).map(([k, v]) =>
                      renderNode(v, [...path, i, k], k),
                    )
                  : renderLeaf(item, [...path, i], key)}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            style={{ marginTop: 12 }}
            onClick={() =>
              setAt(path, [
                ...node,
                sample !== undefined ? blankLike(sample) : "",
              ] as Json)
            }
          >
            <Icon name="plus" width={14} height={14} />
            Add {humanise(key).replace(/s$/, "").toLowerCase()}
          </button>
        </fieldset>
      );
    }

    /* ── nested objects ── */
    if (typeof node === "object" && node !== null) {
      return (
        <fieldset
          key={name}
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-s)",
            padding: 18,
            marginBottom: 24,
          }}
        >
          <legend
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--muted)",
              padding: "0 8px",
            }}
          >
            {humanise(key)}
          </legend>
          {Object.entries(node).map(([k, v]) => renderNode(v, [...path, k], k))}
        </fieldset>
      );
    }

    return renderLeaf(node, path, key);
  }

  function renderLeaf(
    node: Json,
    path: (string | number)[],
    key: string,
  ): React.ReactNode {
    const name = [sectionKey, ...path].join(".");
    const id = name.replace(/\./g, "_");

    if (typeof node === "boolean") {
      return (
        <div className="field" key={name}>
          <label
            htmlFor={id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textTransform: "none",
              letterSpacing: 0,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--body)",
              cursor: "pointer",
            }}
          >
            <input
              id={id}
              type="checkbox"
              checked={node}
              onChange={(e) => setAt(path, e.target.checked)}
              style={{ width: 17, height: 17, accentColor: "var(--blue)" }}
            />
            {humanise(key)}
          </label>
          <input type="hidden" name={name} value={String(node)} />
        </div>
      );
    }

    if (typeof node === "number") {
      return (
        <div className="field" key={name}>
          <label htmlFor={id}>{humanise(key)}</label>
          <input
            id={id}
            name={name}
            type="number"
            value={node}
            onChange={(e) => setAt(path, Number(e.target.value))}
          />
        </div>
      );
    }

    const text = String(node ?? "");
    const multiline =
      LONG_KEYS.has(key) || text.length > 90 || text.includes("\n");

    return (
      <div className="field" key={name}>
        <label htmlFor={id}>{humanise(key)}</label>
        {multiline ? (
          <textarea
            id={id}
            name={name}
            rows={Math.min(8, Math.max(2, Math.ceil(text.length / 70) + 1))}
            value={text}
            onChange={(e) => setAt(path, e.target.value)}
          />
        ) : (
          <input
            id={id}
            name={name}
            type="text"
            value={text}
            onChange={(e) => setAt(path, e.target.value)}
          />
        )}
        {HINTS[key] && <span className="hint">{HINTS[key]}</span>}
      </div>
    );
  }

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="__section" value={sectionKey} />

        {state?.error && <Alert kind="error">{state.error}</Alert>}
        {state?.success && <Alert kind="success">{state.success}</Alert>}

        <div className="card">
          <div className="card-head">
            <h2>{label}</h2>
            <span className="cap">Section key: {sectionKey}</span>
          </div>
          <div className="card-body">
            {Object.entries(value).map(([k, v]) => renderNode(v, [k], k))}
          </div>
          <div className="card-foot">
            <div className="row-gap">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
              >
                {pending ? "Saving…" : "Save & Publish"}
              </button>
              <span className="small muted">
                Changes go live on the public site immediately.
              </span>
            </div>
          </div>
        </div>
      </form>

      <ResetForm sectionKey={sectionKey} onReset={() => setValue(initial)} />
    </>
  );
}

function ResetForm({
  sectionKey,
  onReset,
}: {
  sectionKey: string;
  onReset: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetContentSectionAction,
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Reset this section to the original wording? Your edits are discarded.",
          )
        ) {
          e.preventDefault();
          return;
        }
        onReset();
      }}
      style={{ marginTop: 20 }}
    >
      <input type="hidden" name="__section" value={sectionKey} />
      {state?.success && <Alert kind="success">{state.success}</Alert>}
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <button type="submit" className="btn btn-quiet btn-sm" disabled={pending}>
        <Icon name="refresh" width={14} height={14} />
        Reset to original wording
      </button>
    </form>
  );
}
