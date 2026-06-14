"use client";

/** A TipTap image node that the author can resize by dragging a corner
 *  handle and annotate with a caption — replacing the stock @tiptap image.
 *
 *  Stored / published HTML is a semantic <figure>:
 *
 *    <figure class="img-figure" style="width:60%">
 *      <img src="…" alt="…" />
 *      <figcaption>Caption text</figcaption>   // omitted when empty
 *    </figure>
 *
 *  `width` is a percentage of the article column, so images stay
 *  responsive.  Plain <img> from older posts is parsed too (→ 100%, no
 *  caption) so nothing breaks. */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";

// Our own command name — deliberately NOT `setImage`.  @tiptap/extension-image
// (still a dependency) declares `image.setImage` with a fixed signature, so
// re-declaring `setImage` with extra attrs is a hard TS error.  A uniquely
// named command merges cleanly into the `image` command group and types the
// same way whether or not the package's declaration is in the compilation.
type ResizableImageAttrs = { src: string; alt?: string; title?: string; width?: string; caption?: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      setResizableImage: (attrs: ResizableImageAttrs) => ReturnType;
    };
  }
}

const MIN_PCT = 20;
const MAX_PCT = 100;

export const ResizableImage = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  selectable: true,
  atom: true, // caption lives in an attribute, not as editable child content

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: "100%",
        parseHTML: (el) =>
          (el as HTMLElement).style?.width ||
          (el.querySelector?.("img") as HTMLElement | null)?.style?.width ||
          "100%",
        renderHTML: () => ({}), // width is rendered on the <figure>, not here
      },
      caption: {
        default: "",
        parseHTML: (el) =>
          (el.querySelector?.("figcaption") as HTMLElement | null)?.textContent ?? "",
        renderHTML: () => ({}), // caption is rendered as a <figcaption>
      },
    };
  },

  parseHTML() {
    return [
      { tag: "figure.img-figure" },
      { tag: "img[src]" }, // back-compat with older plain-image posts
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, title, width, caption } = node.attrs as Record<string, string>;
    const w = width || "100%";
    const img = [
      "img",
      mergeAttributes(HTMLAttributes, { src, alt, title, style: "width:100%" }),
    ];
    const children: unknown[] = [img];
    if (caption && caption.trim()) children.push(["figcaption", {}, caption]);
    return [
      "figure",
      { class: "img-figure", style: `width:${w}` },
      ...(children as []),
    ];
  },

  addCommands() {
    return {
      setResizableImage:
        (attrs: ResizableImageAttrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

function ImageNodeView({ node, updateAttributes, selected, editor }: ReactNodeViewProps) {
  const { src, alt, title, width, caption } = node.attrs as Record<string, string>;
  const wrapRef = useRef<HTMLDivElement>(null);

  function startResize(e: ReactPointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startPx = wrapRef.current?.offsetWidth ?? 0;
    // Width of the editable column — % is measured against this.
    const colPx = (editor.view.dom as HTMLElement).clientWidth || startPx || 1;

    const onMove = (ev: PointerEvent) => {
      const nextPx = startPx + (ev.clientX - startX);
      const pct = Math.round((nextPx / colPx) * 100);
      const clamped = Math.min(MAX_PCT, Math.max(MIN_PCT, pct));
      updateAttributes({ width: `${clamped}%` });
    };
    const onUp = (ev: PointerEvent) => {
      try {
        handle.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer already released */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const showCaption = selected || (caption && caption.trim().length > 0);

  return (
    <NodeViewWrapper
      as="figure"
      className="img-figure group relative my-3"
      style={{ width: width || "100%" }}
      data-drag-handle
    >
      <div ref={wrapRef} className="relative inline-block w-full align-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          title={title ?? undefined}
          className={`w-full rounded-xl ${
            selected ? "ring-2 ring-brand-blue ring-offset-2" : ""
          }`}
          draggable={false}
        />

        {/* Corner resize handle — appears on hover / when selected. */}
        <span
          onPointerDown={startResize}
          title="Drag to resize"
          className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue shadow transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        />
      </div>

      {showCaption ? (
        <input
          value={caption ?? ""}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="ছবির ক্যাপশন (ঐচ্ছিক)…"
          className="mt-1.5 w-full border-0 bg-transparent text-center text-sm italic text-fg-muted outline-none placeholder:text-fg-faint focus:bg-bg-soft focus:rounded-md focus:py-1"
        />
      ) : null}
    </NodeViewWrapper>
  );
}
