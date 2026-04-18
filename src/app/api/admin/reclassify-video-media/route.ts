import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";

export const maxDuration = 120;

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

interface Message {
  id: string;
  character_id: string;
  text?: string;
  media_url?: string;
  media_type?: string;
  order?: number;
}

interface ChatShape {
  type?: string;
  characters?: unknown[];
  messages?: Message[];
}

function looksLikeVideo(url: string | undefined): boolean {
  if (!url) return false;
  return VIDEO_EXT_RE.test(url);
}

export async function POST() {
  const { supabase, response, adminUserId } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = {
    chaptersChecked: 0,
    chaptersUpdated: 0,
    chaptersFailed: 0,
    messagesReclassified: 0,
  };
  const log: string[] = [];

  const { data: rows, error } = await supabase
    .from("chapter_content")
    .select("id, content_json")
    .limit(2000);

  if (error) {
    return NextResponse.json(
      { error: `chapter_content query failed: ${error.message}` },
      { status: 500 }
    );
  }

  for (const row of rows ?? []) {
    summary.chaptersChecked++;
    const content = row.content_json as ChatShape | null;
    if (!content || !Array.isArray(content.messages)) continue;

    let changed = 0;
    const newMessages = content.messages.map((m) => {
      if (looksLikeVideo(m.media_url) && m.media_type !== "video") {
        changed++;
        return { ...m, media_type: "video" };
      }
      return m;
    });

    if (changed === 0) continue;

    const newContent = { ...content, messages: newMessages };

    const { error: updateErr } = await supabase
      .from("chapter_content")
      .update({ content_json: newContent })
      .eq("id", row.id);

    if (updateErr) {
      summary.chaptersFailed++;
      log.push(`FAIL: ${row.id} — ${updateErr.message}`);
    } else {
      summary.chaptersUpdated++;
      summary.messagesReclassified += changed;
    }
  }

  console.log(
    `[Admin reclassify-video-media] ${adminUserId} checked=${summary.chaptersChecked} updated=${summary.chaptersUpdated} messages=${summary.messagesReclassified}`
  );

  return NextResponse.json({ summary, log });
}
