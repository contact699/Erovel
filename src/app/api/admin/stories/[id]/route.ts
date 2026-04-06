import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";
import { signCdnUrl } from "@/lib/bunny";

function signUrlsInJson(obj: unknown): unknown {
  if (typeof obj === "string") {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, response } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Fetch story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select(
        "*, creator:profiles!creator_id(id, username, display_name, avatar_url)"
      )
      .eq("id", id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch all chapters with content — no status filter, no password check
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("*, content:chapter_content(content_json)")
      .eq("story_id", id)
      .order("chapter_number", { ascending: true });

    if (chaptersError) {
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    // Sign CDN URLs in all chapter content
    const signedChapters = (chapters ?? []).map((ch) => ({
      ...ch,
      content: ch.content?.content_json
        ? { content_json: signUrlsInJson(ch.content.content_json) }
        : ch.content,
    }));

    return NextResponse.json({ story, chapters: signedChapters });
  } catch {
    return NextResponse.json({ error: "Failed to load story" }, { status: 500 });
  }
}
