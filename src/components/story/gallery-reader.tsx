"use client";

import { useState } from "react";
import type { ChatContent } from "@/lib/types";
import { Lightbox } from "@/components/ui/lightbox";

interface GalleryReaderProps {
  content: ChatContent;
  /** If set, only show this many media items (for gated content) */
  teaserLimit?: number;
}

export function GalleryReader({ content, teaserLimit }: GalleryReaderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { messages } = content;
  const sorted = [...messages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Filter to only messages that have media
  const mediaMessages = sorted.filter((msg) => msg.media_url);

  // Collect all image/gif URLs for lightbox gallery navigation
  const allImageUrls = mediaMessages
    .filter((msg) => msg.media_type === "image" || msg.media_type === "gif")
    .map((msg) => msg.media_url!);

  const visibleMessages = teaserLimit
    ? mediaMessages.slice(0, teaserLimit)
    : mediaMessages;

  if (mediaMessages.length === 0) {
    return (
      <div className="py-16 text-center text-muted">
        <p>No content available.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile edge-to-edge; desktop caps at ~3xl for comfortable reading.
          Negative horizontal margins on small screens cancel the parent's
          px-4 so images truly fill the viewport. */}
      <div className="-mx-4 sm:mx-auto max-w-3xl space-y-6 sm:space-y-8 py-4 sm:py-6">
        {visibleMessages.map((msg) => (
          <div key={msg.id}>
            {/* Image or GIF */}
            {msg.media_url &&
              (msg.media_type === "image" || msg.media_type === "gif") && (
                <button
                  onClick={() => setLightboxSrc(msg.media_url!)}
                  className="w-full cursor-pointer block"
                >
                  <img
                    src={msg.media_url}
                    alt={msg.text || "Gallery image"}
                    className="w-full sm:rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.alt = "Image could not be loaded";
                      e.currentTarget.className =
                        "w-full h-32 sm:rounded-lg bg-surface-hover flex items-center justify-center text-muted text-sm";
                    }}
                  />
                </button>
              )}

            {/* Video */}
            {msg.media_url && msg.media_type === "video" && (
              <video
                src={msg.media_url}
                controls
                className="w-full sm:rounded-lg"
              >
                <track kind="captions" />
              </video>
            )}

            {/* Caption */}
            {msg.text && (
              <p className="text-sm text-muted text-center mt-2 px-4 sm:px-0">
                {msg.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox with gallery navigation */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Full size media"
          gallery={allImageUrls}
          onClose={() => setLightboxSrc(null)}
          onNavigate={(newSrc) => setLightboxSrc(newSrc)}
        />
      )}
    </>
  );
}
