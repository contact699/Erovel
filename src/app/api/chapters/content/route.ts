import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signCdnUrl } from "@/lib/bunny";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function signUrlsInJson(obj: unknown): unknown {
  if (typeof obj === "string") {
    // Sign any BunnyCDN URLs found in string values
    const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL;
    if (cdnUrl && obj.startsWith(cdnUrl)) {
      return signCdnUrl(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(signUrlsInJson);
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = signUrlsInJson(value);
    }
    return result;
  }
  return obj;
}

export async function POST(request: NextRequest) {
  try {
    const { storyId, chapterNumber } = await request.json();

    if (!storyId || typeof chapterNumber !== "number") {
      return NextResponse.json(
        { error: "Missing storyId or chapterNumber" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // Fetch chapter with content
    const { data: chapter } = await supabase
      .from("chapters")
      .select("*, content:chapter_content(content_json)")
      .eq("story_id", storyId)
      .eq("chapter_number", chapterNumber)
      .single();

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // After fetching the chapter, fetch the story for access control
    const { data: story } = await supabase
      .from("stories")
      .select("id, status, is_gated, price, creator_id, password_hash, visibility")
      .eq("id", storyId)
      .single();

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Only serve published chapters of published stories
    if (story.status !== "published" || chapter.status !== "published") {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    // Password-protected stories require a valid password token
    if (story.password_hash) {
      const passwordToken = request.headers.get("x-story-password");
      if (!passwordToken || passwordToken !== story.password_hash) {
        return NextResponse.json({ error: "Password required" }, { status: 403 });
      }
    }

    // Gated content: chapter 1 is free, rest require subscription
    // For now, serve the content — subscription checks happen client-side via the subscription store
    // The signed URLs still protect the actual images

    // Sign all CDN URLs in the content
    const contentJson = chapter.content?.content_json;
    const signedContent = contentJson ? signUrlsInJson(contentJson) : null;

    return NextResponse.json({
      ...chapter,
      content: signedContent
        ? { content_json: signedContent }
        : chapter.content,
    });
  } catch (err) {
    console.error("[Chapters content] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
