import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-auth";

export const maxDuration = 120;

interface OldCharacter {
  id: string;
  name: string;
  color?: string;
  alignment?: "left" | "right";
  avatar_url?: string | null;
}

interface OldMessage {
  id: string;
  character_id: string;
  text?: string;
  media_url?: string;
  media_type?: string;
  order?: number;
}

interface ChatShape {
  type?: string;
  characters?: OldCharacter[];
  messages?: OldMessage[];
}

function isDefaultImportChatShape(content: unknown): content is ChatShape {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;
  const chars = c.characters as unknown;
  if (!Array.isArray(chars) || chars.length !== 2) return false;
  const names = chars
    .map((x) => (x as { name?: unknown }).name)
    .filter((n): n is string => typeof n === "string")
    .sort();
  return names[0] === "Character 1" && names[1] === "Character 2";
}

export async function POST() {
  const { supabase, response, adminUserId } = await requireAdminRoute();
  if (!supabase || response) {
    return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = { chaptersChecked: 0, chaptersUpdated: 0, chaptersFailed: 0 };
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
    const content = row.content_json as unknown;
    if (!isDefaultImportChatShape(content)) continue;

    const shape = content as ChatShape;
    const messages = (shape.messages ?? []).map((m) => ({
      ...m,
      character_id: "char-1",
    }));
    const newContent = {
      ...shape,
      characters: [
        {
          id: "char-1",
          name: "",
          color: "#10B981",
          alignment: "right" as const,
        },
      ],
      messages,
    };

    const { error: updateErr } = await supabase
      .from("chapter_content")
      .update({ content_json: newContent })
      .eq("id", row.id);

    if (updateErr) {
      summary.chaptersFailed++;
      log.push(`FAIL: ${row.id} — ${updateErr.message}`);
    } else {
      summary.chaptersUpdated++;
    }
  }

  console.log(
    `[Admin consolidate-import-characters] ${adminUserId} processed ${summary.chaptersChecked} chapters, updated ${summary.chaptersUpdated}`
  );

  return NextResponse.json({ summary, log });
}
