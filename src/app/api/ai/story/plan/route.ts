import { NextRequest, NextResponse } from "next/server";
import { requireAiAccess } from "@/lib/ai/require-ai-access";
import { BriefSchema } from "@/lib/ai/schemas";
import { buildSystemPrompt, truncateToneReference } from "@/lib/ai/system-prompts";
import { generateStructured, SafetyRefusalError } from "@/lib/ai/gemini";
import { recordGeneration } from "@/lib/ai/rate-limit";

export const maxDuration = 60;

const OUTLINE_SCHEMA = {
  type: "object",
  properties: {
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          synopsis: { type: "string" },
        },
        required: ["title", "synopsis"],
      },
    },
  },
  required: ["outline"],
} as const;

export async function POST(request: NextRequest) {
  // Plan generations are cheap and one-shot per story; skip rate-limit check.
  const access = await requireAiAccess({ checkRateLimit: false });
  if (!access.ok) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parse = BriefSchema.safeParse((raw as { brief?: unknown })?.brief);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid brief", details: parse.error.issues },
      { status: 400 }
    );
  }
  const brief = parse.data;
  const toneRef = truncateToneReference(
    (raw as { toneReferenceText?: string })?.toneReferenceText,
    2000
  );

  const systemPrompt = buildSystemPrompt(brief);
  const userPrompt = buildPlanUserPrompt(brief, toneRef);

  try {
    const result = await generateStructured<{
      outline: { title: string; synopsis: string }[];
    }>({
      systemPrompt,
      userPrompt,
      responseSchema: OUTLINE_SCHEMA,
      temperature: 0.8,
      maxOutputTokens: 2000,
    });

    await recordGeneration(access.supabase, {
      userId: access.userId,
      kind: "plan",
      storyId: null,
      chapterId: null,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    });

    console.log(
      `[AI plan] user=${access.userId} chapters=${brief.chapterCount} ` +
        `tokens=${result.tokensIn}/${result.tokensOut}`
    );

    return NextResponse.json({ outline: result.parsed.outline });
  } catch (err) {
    if (err instanceof SafetyRefusalError) {
      return NextResponse.json(
        {
          error: "refusal",
          message:
            "Gemini refused to plan this story. Try rewording themes or characters.",
        },
        { status: 422 }
      );
    }
    console.error("[AI plan] error:", err);
    return NextResponse.json(
      { error: "Generation failed", details: String(err).slice(0, 200) },
      { status: 502 }
    );
  }
}

function buildPlanUserPrompt(
  brief: import("@/lib/ai/schemas").Brief,
  toneRef: string
): string {
  const chars = brief.characters
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");
  const themes = brief.themes.length ? brief.themes.join(", ") : "(none specified)";
  const tone = toneRef
    ? `\n\nVoice reference (mimic tone, pacing, vocabulary — do not copy prose verbatim):\n${toneRef}`
    : "";

  return `Plan a ${brief.chapterCount}-chapter ${brief.format} story.

Title: ${brief.title}
Description: ${brief.description}
Category: ${brief.categoryId}
Themes / kinks: ${themes}

Characters:
${chars}

Return a JSON object with shape:
{ "outline": [ { "title": "...", "synopsis": "one-sentence synopsis" }, ... ] }

The outline must contain exactly ${brief.chapterCount} entries. Pace the arc so early chapters set up, middle chapters escalate, and the final chapter pays off.${tone}`;
}
