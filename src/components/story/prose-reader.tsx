"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";

interface ProseNode {
  type: string;
  attrs?: Record<string, string>;
  content?: ProseNode[];
  text?: string;
  marks?: { type: string }[];
}

interface ProseReaderProps {
  content?: Record<string, unknown>;
  teaserLimit?: number;
}

export function ProseReader({ content, teaserLimit }: ProseReaderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const nodes = (Array.isArray(content?.content) ? content.content : []) as ProseNode[];
  const visible = teaserLimit ? nodes.slice(0, teaserLimit) : nodes;
  const hasMore = teaserLimit ? nodes.length > teaserLimit : false;

  if (nodes.length === 0) {
    return (
      <div className="py-16 text-center text-muted">
        <p>No content available.</p>
      </div>
    );
  }

  function renderText(node: ProseNode): React.ReactNode {
    if (node.type === "text") {
      let el: React.ReactNode = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") el = <strong>{el}</strong>;
          if (mark.type === "italic") el = <em>{el}</em>;
        }
      }
      return el;
    }
    return null;
  }

  function renderNode(node: ProseNode, idx: number): React.ReactNode {
    switch (node.type) {
      case "paragraph":
        return (
          <p key={idx}>
            {node.content?.map((child, i) => (
              <span key={i}>{renderText(child)}</span>
            ))}
          </p>
        );

      case "heading": {
        const level = node.attrs?.level || "2";
        const Tag = level === "3" ? "h3" : "h2";
        return (
          <Tag key={idx}>
            {node.content?.map((child, i) => (
              <span key={i}>{renderText(child)}</span>
            ))}
          </Tag>
        );
      }

      case "image":
        return (
          <figure key={idx} className="my-6">
            <button
              onClick={() => setLightboxSrc(node.attrs?.src || "")}
              className="w-full cursor-pointer block"
            >
              <img
                src={node.attrs?.src}
                alt={node.attrs?.alt || ""}
                className="w-full rounded-lg"
                loading="lazy"
              />
            </button>
            {node.attrs?.alt && (
              <figcaption className="text-xs text-muted text-center mt-2 italic">
                {node.attrs.alt}
              </figcaption>
            )}
          </figure>
        );

      case "horizontalRule":
        return <hr key={idx} />;

      default:
        return null;
    }
  }

  return (
    <>
      <div className="story-prose py-8 px-4 sm:px-0">
        {visible.map((node, idx) => renderNode(node, idx))}

        {hasMore && (
          <div className="text-center text-muted italic mt-4">
            Content continues...
          </div>
        )}

        {!teaserLimit && nodes.length > 0 && (
          <p className="italic text-muted text-center mt-8" style={{ textIndent: 0 }}>
            End of chapter
          </p>
        )}
      </div>

      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Full size image"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
