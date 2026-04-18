import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";
import { uploadToBunny } from "@/lib/bunny";
import { moderateImage } from "@/lib/moderation";
import { generateId } from "@/lib/utils";

export const maxDuration = 300;

const IMGCHEST_REGEX = /https?:\/\/[^"'\s]*imgchest\.com[^"'\s]*/g;
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];

/**
 * Recursively walk a JSON structure and replace any string values
 * that match keys in the urlMap with their mapped values.
 */
function replaceUrlsInJson(
  obj: unknown,
  urlMap: Map<string, string>
): unknown {
  if (typeof obj === "string") {
    return urlMap.get(obj) ?? obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceUrlsInJson(item, urlMap));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = replaceUrlsInJson(value, urlMap);
    }
    return result;
  }
  return obj;
}

/**
 * Download an image from a URL and return its bytes and file extension.
 */
async function downloadImage(
  url: string
): Promise<{ buffer: Uint8Array; ext: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const urlPath = new URL(url).pathname;
    const ext = urlPath.split(".").pop()?.toLowerCase() || "jpg";
    return { buffer: new Uint8Array(arrayBuffer), ext };
  } catch {
    return null;
  }
}

export async function POST() {
  const { supabase, response } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = {
      imagesRehosted: 0,
      imagesFailed: 0,
      imagesBlocked: 0,
      chaptersUpdated: 0,
      coversUpdated: 0,
    };
    const log: string[] = [];

    // --- Phase 1: Migrate chapter_content images ---

    const { data: chapters, error: chaptersError } = await supabase
      .from("chapter_content")
      .select(
        "id, chapter_id, content_json, chapters!inner(story_id, stories!inner(creator_id))"
      )
      .limit(1000);

    if (chaptersError) {
      return NextResponse.json(
        { error: "Failed to query chapters", details: chaptersError.message },
        { status: 500 }
      );
    }

    for (const chapter of chapters || []) {
      const contentStr = JSON.stringify(chapter.content_json);
      const imgchestUrls = contentStr.match(IMGCHEST_REGEX);
      if (!imgchestUrls || imgchestUrls.length === 0) continue;

      // Deduplicate URLs within this chapter
      const uniqueUrls = [...new Set(imgchestUrls)];

      // Extract creator_id from the joined data
      const chapterData = chapter.chapters as unknown as {
        story_id: string;
        stories: { creator_id: string };
      };
      const creatorId = chapterData?.stories?.creator_id;
      if (!creatorId) {
        for (const url of uniqueUrls) {
          log.push(`FAIL: ${url} - could not resolve creator_id`);
          summary.imagesFailed++;
        }
        continue;
      }

      const urlMap = new Map<string, string>();

      for (const url of uniqueUrls) {
        const downloaded = await downloadImage(url);
        if (!downloaded) {
          log.push(`FAIL: ${url} - download failed`);
          summary.imagesFailed++;
          continue;
        }

        const { buffer, ext } = downloaded;
        const isVideo = VIDEO_EXTENSIONS.includes(ext);

        // Run moderation on images (not videos)
        if (!isVideo) {
          const modResult = await moderateImage(buffer);
          if (modResult.blocked) {
            log.push(
              `BLOCKED: ${url} - ${modResult.reason || "Content blocked by moderation"}`
            );
            summary.imagesBlocked++;
            continue;
          }
        }

        // Upload to BunnyCDN
        try {
          const fileName = `${generateId()}.${ext}`;
          const folder = `imports/${creatorId}`;
          const { url: cdnUrl } = await uploadToBunny(buffer, fileName, folder);
          urlMap.set(url, cdnUrl);
          summary.imagesRehosted++;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown upload error";
          log.push(`FAIL: ${url} - ${message}`);
          summary.imagesFailed++;
        }
      }

      // Replace URLs in content_json and update the row
      if (urlMap.size > 0) {
        const updatedContent = replaceUrlsInJson(
          chapter.content_json,
          urlMap
        );

        const { error: updateError } = await supabase
          .from("chapter_content")
          .update({ content_json: updatedContent })
          .eq("id", chapter.id);

        if (updateError) {
          log.push(
            `FAIL: chapter_content ${chapter.id} update - ${updateError.message}`
          );
        } else {
          summary.chaptersUpdated++;
        }
      }
    }

    // --- Phase 2: Migrate story cover images ---

    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, creator_id, cover_image_url")
      .like("cover_image_url", "%imgchest.com%")
      .limit(1000);

    if (storiesError) {
      log.push(`FAIL: stories query - ${storiesError.message}`);
    }

    for (const story of stories || []) {
      const url = story.cover_image_url as string;
      if (!url) continue;

      const downloaded = await downloadImage(url);
      if (!downloaded) {
        log.push(`FAIL: ${url} - download failed (cover)`);
        summary.imagesFailed++;
        continue;
      }

      const { buffer, ext } = downloaded;
      const isVideo = VIDEO_EXTENSIONS.includes(ext);

      if (!isVideo) {
        const modResult = await moderateImage(buffer);
        if (modResult.blocked) {
          log.push(
            `BLOCKED: ${url} - ${modResult.reason || "Content blocked by moderation"}`
          );
          summary.imagesBlocked++;
          continue;
        }
      }

      try {
        const fileName = `${generateId()}.${ext}`;
        const folder = `imports/${story.creator_id}`;
        const { url: cdnUrl } = await uploadToBunny(buffer, fileName, folder);

        const { error: updateError } = await supabase
          .from("stories")
          .update({ cover_image_url: cdnUrl })
          .eq("id", story.id);

        if (updateError) {
          log.push(
            `FAIL: story ${story.id} cover update - ${updateError.message}`
          );
          summary.imagesFailed++;
        } else {
          summary.imagesRehosted++;
          summary.coversUpdated++;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown upload error";
        log.push(`FAIL: ${url} - ${message}`);
        summary.imagesFailed++;
      }
    }

    return NextResponse.json({ summary, log });
  } catch (err) {
    console.error("Rehost migration error:", err);
    return NextResponse.json(
      { error: "Migration failed", details: String(err) },
      { status: 500 }
    );
  }
}
