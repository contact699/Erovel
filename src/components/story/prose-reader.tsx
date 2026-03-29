"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";
import { ImageIcon } from "lucide-react";

interface ProseReaderProps {
  /** If set, only show this many paragraphs then blur the rest */
  teaserLimit?: number;
}

/** Placeholder paragraphs used when real TipTap content is unavailable */
const PLACEHOLDER_PARAGRAPHS = [
  `The evening had settled over the city like a held breath. She stood at the window of his corner office, watching the last light bleed from the skyline, and wondered how it was possible to feel so entirely known by someone she had only met six weeks ago. The glass was cool beneath her fingertips. Behind her she could hear him pouring two measures of bourbon, the soft clink of crystal deliberate, unhurried, as if time were something he had decided to own.`,

  `"You're thinking too loudly," he said, and she could hear the half-smile in his voice without turning around. He crossed the room and set her glass on the windowsill beside her hand. His sleeve brushed her bare arm, and the contact sent a low current through her chest, the kind that made her forget whatever careful thing she had planned to say next.`,

  `She took the glass and let the warmth of it anchor her. "I'm thinking about the terms," she said carefully. "About whether they still make sense." The bourbon tasted of oak and smoke and something almost sweet beneath it. She turned to face him and found him closer than she expected, close enough to see the amber the city lights painted in his eyes.`,

  `He studied her for a long moment, the kind of silence that would have been uncomfortable with anyone else. With him it felt like standing at the edge of something vast and knowing that the fall would be worth it. "The terms," he repeated, his voice low. He reached up and tucked a strand of hair behind her ear, his knuckle trailing the line of her jaw. "Are you asking me to change them, or are you telling me you already have?"`,

  `The question hung between them. She set her glass down without looking and closed the distance herself, her hand finding the front of his shirt, feeling the steady beat beneath it. "I'm saying that I didn't come here tonight because of an arrangement." Her voice was steady even as her pulse was not. "I came because I wanted to."`,

  `His hand came to rest at the small of her back, warm and sure, and she felt the last pretense between them dissolve like ink in water. When he kissed her it was slow and deliberate, the way he did everything, and she thought that this was what it meant to cross a line you could never uncross, and to be glad of it.`,
];

export function ProseReader({ teaserLimit }: ProseReaderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const paragraphs = teaserLimit
    ? PLACEHOLDER_PARAGRAPHS.slice(0, teaserLimit)
    : PLACEHOLDER_PARAGRAPHS;

  return (
    <>
      <div className="story-prose py-8 px-4 sm:px-0">
        {/* Opening paragraphs */}
        <p>{paragraphs[0]}</p>
        {paragraphs[1] && <p>{paragraphs[1]}</p>}
        {paragraphs[2] && <p>{paragraphs[2]}</p>}

        {/* Scene break */}
        {!teaserLimit && paragraphs.length > 3 && <hr />}

        {/* Inline image / GIF placeholder */}
        {!teaserLimit && (
          <figure className="my-8">
            <button
              onClick={() => setLightboxSrc("/api/placeholder/800/500")}
              className="w-full cursor-pointer group block"
            >
              <div className="w-full h-56 sm:h-72 rounded-lg bg-surface-hover border border-border flex flex-col items-center justify-center gap-3 group-hover:border-accent/40 transition-colors">
                <ImageIcon size={32} className="text-muted" />
                <span className="text-sm text-muted">
                  Inline image or GIF would appear here
                </span>
                <span className="text-xs text-muted/60">
                  Click for fullscreen
                </span>
              </div>
            </button>
          </figure>
        )}

        {/* Remaining paragraphs */}
        {paragraphs.slice(3).map((p, i) => (
          <p key={i + 3}>{p}</p>
        ))}

        {/* Second scene break if showing full content */}
        {!teaserLimit && <hr />}

        {/* A closing beat (only in full mode) */}
        {!teaserLimit && (
          <p className="italic text-muted text-center" style={{ textIndent: 0 }}>
            End of chapter
          </p>
        )}
      </div>

      {/* Lightbox */}
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
