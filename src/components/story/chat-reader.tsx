"use client";

import { useState } from "react";
import type { ChatContent, ChatCharacter, ChatMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { ImageIcon, Play } from "lucide-react";

interface ChatReaderProps {
  content: ChatContent;
  /** If set, only show this many messages then blur the rest */
  teaserLimit?: number;
}

export function ChatReader({ content, teaserLimit }: ChatReaderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { characters, messages } = content;
  const sorted = [...messages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const charMap = new Map<string, ChatCharacter>();
  characters.forEach((c) => charMap.set(c.id, c));

  const visibleMessages = teaserLimit ? sorted.slice(0, teaserLimit) : sorted;

  return (
    <>
      <div className="max-w-lg mx-auto space-y-1 py-6">
        {visibleMessages.map((msg, idx) => {
          const char = charMap.get(msg.character_id);
          if (!char) return null;

          const isRight = char.alignment === "right";
          const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
          const nextMsg = idx < visibleMessages.length - 1 ? visibleMessages[idx + 1] : null;
          const showName = !prevMsg || prevMsg.character_id !== msg.character_id;
          const isLastInGroup = !nextMsg || nextMsg.character_id !== msg.character_id;

          return (
            <div key={msg.id}>
              {/* Character name label */}
              {showName && (
                <div
                  className={`flex items-center gap-2 mb-1 mt-4 ${
                    isRight ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isRight && (
                    <Avatar
                      src={char.avatar_url}
                      name={char.name}
                      size="sm"
                    />
                  )}
                  <span className="text-xs font-medium text-muted">
                    {char.name}
                  </span>
                  {isRight && (
                    <Avatar
                      src={char.avatar_url}
                      name={char.name}
                      size="sm"
                    />
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`flex ${isRight ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[80%] px-4 py-2.5 text-[0.9375rem] leading-relaxed ${
                    isRight ? "ml-12" : "mr-12"
                  }`}
                  style={{
                    backgroundColor: isRight
                      ? char.color
                      : "var(--surface-hover)",
                    color: isRight ? "#ffffff" : "var(--foreground)",
                    borderRadius: isRight
                      ? showName && isLastInGroup
                        ? "18px 18px 4px 18px"
                        : showName
                        ? "18px 18px 4px 18px"
                        : isLastInGroup
                        ? "18px 4px 4px 18px"
                        : "18px 4px 4px 18px"
                      : showName && isLastInGroup
                      ? "18px 18px 18px 4px"
                      : showName
                      ? "18px 18px 18px 4px"
                      : isLastInGroup
                      ? "4px 18px 18px 4px"
                      : "4px 18px 18px 4px",
                  }}
                >
                  {/* Text content */}
                  {msg.text && <p>{msg.text}</p>}

                  {/* Media placeholder */}
                  {msg.media_url && msg.media_type === "image" && (
                    <button
                      onClick={() => setLightboxSrc(msg.media_url!)}
                      className="mt-2 block w-full cursor-pointer"
                    >
                      <img
                        src={msg.media_url}
                        alt="Shared image"
                        className="rounded-lg max-w-full"
                      />
                    </button>
                  )}
                  {msg.media_url && msg.media_type === "gif" && (
                    <button
                      onClick={() => setLightboxSrc(msg.media_url!)}
                      className="mt-2 block w-full cursor-pointer"
                    >
                      <img
                        src={msg.media_url}
                        alt="GIF"
                        className="rounded-lg max-w-full"
                      />
                    </button>
                  )}
                  {msg.media_url && msg.media_type === "video" && (
                    <button
                      onClick={() => setLightboxSrc(msg.media_url!)}
                      className="mt-2 flex items-center justify-center gap-2 w-full h-32 rounded-lg bg-black/20 cursor-pointer"
                    >
                      <Play size={24} className="text-white/80" />
                    </button>
                  )}

                  {/* Media placeholder when no real URL but type is set */}
                  {!msg.media_url && msg.media_type && (
                    <div
                      className="mt-2 flex items-center justify-center gap-2 w-full h-32 rounded-lg cursor-pointer"
                      style={{
                        backgroundColor: isRight
                          ? "rgba(0,0,0,0.15)"
                          : "rgba(0,0,0,0.06)",
                      }}
                      onClick={() =>
                        setLightboxSrc("/api/placeholder/400/300")
                      }
                    >
                      <ImageIcon
                        size={24}
                        className={isRight ? "text-white/60" : "text-muted"}
                      />
                      <span
                        className={`text-sm ${
                          isRight ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {msg.media_type === "gif"
                          ? "GIF"
                          : msg.media_type === "video"
                          ? "Video"
                          : "Photo"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivered indicator for right-aligned last in group */}
              {isRight && isLastInGroup && (
                <div className="flex justify-end mt-0.5 mr-1">
                  <span className="text-[10px] text-muted">Delivered</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator (shown at end for atmosphere) */}
        {!teaserLimit && (
          <div className="flex justify-start mt-4">
            <div className="flex items-center gap-2 mb-1">
              <Avatar
                src={characters.find((c) => c.alignment === "left")?.avatar_url ?? null}
                name={characters.find((c) => c.alignment === "left")?.name ?? ""}
                size="sm"
              />
            </div>
          </div>
        )}
        {!teaserLimit && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{ backgroundColor: "var(--surface-hover)" }}
            >
              <span
                className="w-2 h-2 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Full size media"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
