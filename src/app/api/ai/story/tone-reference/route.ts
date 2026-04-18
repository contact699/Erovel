import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { truncateToneReference } from "@/lib/ai/system-prompts";

const TONE_WORD_LIMIT = 2000;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  // Auth only — feature-flag and verify gates don't apply here; this is
  // a passive data lookup, not an AI call.
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storyId?: string; storySlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.storyId && !body.storySlug) {
    return NextResponse.json(
      { error: "Provide storyId or storySlug" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const storyQ = admin
    .from("stories")
    .select("id, status, visibility")
    .limit(1);
  const { data: story } = body.storyId
    ? await storyQ.eq("id", body.storyId).single()
    : await storyQ.eq("slug", body.storySlug!).single();

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.status !== "published" || story.visibility !== "public") {
    return NextResponse.json(
      { error: "Can only reference published public stories" },
      { status: 403 }
    );
  }

  const { data: chapters } = await admin
    .from("chapter_content")
    .select("content_json, chapters!inner(story_id, chapter_number)")
    .eq("chapters.story_id", story.id)
    .order("chapter_number", { ascending: true, referencedTable: "chapters" })
    .limit(20);

  // Flatten whatever content shapes we see (prose TipTap JSON, or chat
  // characters+messages) into plain text for the voice sample.
  const chunks: string[] = [];
  for (const row of chapters ?? []) {
    const c = row.content_json as unknown;
    chunks.push(flattenToText(c));
    if (chunks.join(" ").split(/\s+/).length >= TONE_WORD_LIMIT) break;
  }

  const text = truncateToneReference(chunks.join("\n\n"), TONE_WORD_LIMIT);
  return NextResponse.json({ text });
}

function flattenToText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const c = content as Record<string, unknown>;

  // Chat shape
  if (Array.isArray(c.messages)) {
    return (c.messages as Array<Record<string, unknown>>)
      .map((m) => (typeof m.text === "string" ? m.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  // TipTap prose shape
  const out: string[] = [];
  walk(c, out);
  return out.join(" ");
}

function walk(node: Record<string, unknown>, out: string[]) {
  if (typeof node.text === "string") {
    out.push(node.text);
  }
  const content = node.content;
  if (Array.isArray(content)) {
    for (const child of content) {
      if (child && typeof child === "object") {
        walk(child as Record<string, unknown>, out);
      }
    }
  }
}
