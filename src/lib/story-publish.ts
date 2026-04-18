import {
  createStory,
  createChapter,
  saveChapterContent,
  updateStory,
  updateChapter,
  generateSlug,
  saveStoryTags,
} from "@/lib/supabase/queries";
import type { StoryFormat, ChatContent } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

export interface StoryMeta {
  title: string;
  description: string;
  categoryId: string;
  format: StoryFormat;
  tags: string[];
  isGated: boolean;
  storyPrice: number;
  visibility: "public" | "unlisted";
  passwordHash: string | null;
  coverImageUrl: string | null;
  aiContext?: Record<string, unknown>;
  aiGenerated?: boolean;
}

export interface ChapterPayload {
  title: string;
  chapterNumber: number;
  proseContent?: JSONContent;
  chatContent?: ChatContent;
  publishAt?: string | null;
  dbId?: string;
}

/**
 * Saves a story (creating or updating) plus its chapters. Used by both the
 * manual /dashboard/stories/new flow and the AI wizard.
 */
export async function saveStoryWithChapters(opts: {
  existingStoryId: string | null;
  meta: StoryMeta;
  chapters: ChapterPayload[];
  status: "draft" | "published";
  creatorId: string;
}): Promise<{ storyId: string }> {
  const slug = generateSlug(opts.meta.title);

  let storyId: string | null = opts.existingStoryId;

  if (!storyId) {
    const story = await createStory({
      creator_id: opts.creatorId,
      title: opts.meta.title,
      slug,
      description: opts.meta.description,
      category_id: opts.meta.categoryId,
      format: opts.meta.format,
      is_gated: opts.meta.isGated,
      price: opts.meta.storyPrice,
      visibility: opts.meta.visibility,
      password_hash: opts.meta.passwordHash,
      cover_image_url: opts.meta.coverImageUrl,
      status: opts.status,
      ai_context: opts.meta.aiContext ?? null,
      ai_generated: opts.meta.aiGenerated ?? false,
    });
    if (!story) throw new Error("createStory returned null");
    storyId = story.id as string;
  } else {
    await updateStory(storyId, {
      title: opts.meta.title,
      description: opts.meta.description,
      category_id: opts.meta.categoryId,
      format: opts.meta.format,
      is_gated: opts.meta.isGated,
      price: opts.meta.storyPrice,
      visibility: opts.meta.visibility,
      password_hash: opts.meta.passwordHash,
      cover_image_url: opts.meta.coverImageUrl,
      status: opts.status,
      ai_context: opts.meta.aiContext ?? null,
      ai_generated: opts.meta.aiGenerated ?? false,
    });
  }

  const resolvedStoryId: string = storyId;

  await saveStoryTags(resolvedStoryId, opts.meta.tags);

  for (const ch of opts.chapters) {
    let chapterDbId: string | undefined = ch.dbId;
    if (!chapterDbId) {
      const created = await createChapter({
        story_id: resolvedStoryId,
        title: ch.title,
        chapter_number: ch.chapterNumber,
        status: opts.status,
        publish_at: ch.publishAt ?? null,
      });
      if (!created) throw new Error("createChapter returned null");
      chapterDbId = created.id as string;
    } else {
      await updateChapter(chapterDbId, {
        title: ch.title,
        chapter_number: ch.chapterNumber,
        status: opts.status,
        publish_at: ch.publishAt ?? null,
      });
    }

    if (ch.proseContent || ch.chatContent) {
      await saveChapterContent(chapterDbId, ch.proseContent ?? ch.chatContent!);
    }
  }

  return { storyId: resolvedStoryId };
}
