import type { ChatContent } from "@/lib/types";

/**
 * Imported/consolidated content uses a single unnamed right-aligned speaker.
 * That pattern renders better as a gallery than as chat bubbles, regardless
 * of the story's declared `format` field. This check lets the reader UI
 * automatically pick GalleryReader when the content has this shape.
 */
export function isGalleryLikeContent(content: ChatContent | null): boolean {
  if (!content) return false;
  const chars = content.characters;
  if (!Array.isArray(chars) || chars.length !== 1) return false;
  return !chars[0]?.name;
}

/**
 * The effective format for rendering. Upgrades declared "chat" to "gallery"
 * when the content is clearly a single-speaker gallery.
 */
export function effectiveStoryFormat(
  declaredFormat: string,
  content: ChatContent | null
): string {
  if (isGalleryLikeContent(content)) return "gallery";
  return declaredFormat;
}
