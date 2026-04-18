import { NextRequest } from "next/server";
import { requireAiAccess } from "@/lib/ai/require-ai-access";
import {
  BriefSchema,
  ProseChapterOutputSchema,
  ChatChapterOutputSchema,
  MediaCaptionSchema,
  RegenHintSchema,
} from "@/lib/ai/schemas";
import { buildSystemPrompt, truncateToneReference } from "@/lib/ai/system-prompts";
import { generateStream, SafetyRefusalError } from "@/lib/ai/gemini";
import { recordGeneration } from "@/lib/ai/rate-limit";
import { z } from "zod";

export const maxDuration = 120;

const PROSE_SCHEMA = {
  type: "object",
  properties: {
    content: { type: "object" },
    summary: { type: "string" },
  },
  required: ["content", "summary"],
} as const;

const CHAT_SCHEMA = {
  type: "object",
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          color: { type: "string" },
          alignment: { type: "string", enum: ["left", "right"] },
        },
        required: ["id", "name", "color", "alignment"],
      },
    },
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          character_id: { type: "string" },
          text: { type: "string" },
          media_url: { type: "string" },
          media_type: { type: "string", enum: ["image", "gif", "video"] },
          order: { type: "integer" },
        },
        required: ["id", "character_id"],
      },
    },
    summary: { type: "string" },
  },
  required: ["characters", "messages", "summary"],
} as const;

const RequestSchema = z.object({
  brief: BriefSchema,
  outline: z.array(
    z.object({ title: z.string(), synopsis: z.string() })
  ),
  chapterNumber: z.number().int().min(1),
  priorChapterSummaries: z.array(z.string()),
  mediaCaptions: z.array(MediaCaptionSchema),
  regenHints: z.array(RegenHintSchema).optional(),
  toneReferenceText: z.string().optional(),
  isRegeneration: z.boolean().optional(),
  storyId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

const HINT_TEXT: Record<string, string> = {
  more_explicit: "Push the scene further. Use more graphic, vivid language.",
  more_dialogue: "Include more back-and-forth dialogue between the characters.",
  slower_pacing: "Slow down — linger on sensation and anticipation.",
  shorter: "Keep this chapter brief and tight.",
  longer: "Expand the chapter with more detail and a longer arc.",
};

export async function POST(request: NextRequest) {
  const access = await requireAiAccess({ checkRateLimit: true });
  if (!access.ok) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const req = parsed.data;
  const outputSchema = req.brief.format === "prose" ? PROSE_SCHEMA : CHAT_SCHEMA;
  const systemPrompt = buildSystemPrompt(req.brief);
  const userPrompt = buildChapterUserPrompt(req);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let tokensIn = 0;
        let tokensOut = 0;
        let rawText = "";

        for await (const event of generateStream({
          systemPrompt,
          userPrompt,
          responseSchema: outputSchema,
          maxOutputTokens: 4000,
        })) {
          if (event.type === "delta") {
            rawText += event.text;
            send({ type: "delta", text: event.text });
          } else if (event.type === "final") {
            tokensIn = event.tokensIn;
            tokensOut = event.tokensOut;
            rawText = event.rawText;
          }
        }

        let parsedObj: unknown = null;
        try {
          parsedObj = JSON.parse(rawText);
        } catch {
          send({
            type: "error",
            code: "malformed",
            message:
              "Gemini returned text we couldn't parse. Use the raw output and edit manually.",
            raw: rawText,
          });
          controller.close();
          return;
        }

        const validator =
          req.brief.format === "prose" ? ProseChapterOutputSchema : ChatChapterOutputSchema;
        const validated = validator.safeParse(parsedObj);
        if (!validated.success) {
          send({
            type: "error",
            code: "invalid_shape",
            message: "Output did not match the expected shape.",
            raw: rawText,
          });
          controller.close();
          return;
        }

        await recordGeneration(access.supabase, {
          userId: access.userId,
          kind: req.isRegeneration ? "regenerate" : "chapter",
          storyId: req.storyId ?? null,
          chapterId: req.chapterId ?? null,
          model: "gemini-2.5-flash",
          tokensIn,
          tokensOut,
        });

        send({ type: "final", output: validated.data, tokensIn, tokensOut });
        controller.close();
      } catch (err) {
        if (err instanceof SafetyRefusalError) {
          send({
            type: "error",
            code: "refusal",
            message:
              "Gemini refused that scene. Try rewording themes or characters.",
          });
        } else {
          console.error("[AI chapter] error:", err);
          send({
            type: "error",
            code: "server",
            message: "Generation failed.",
            details: String(err).slice(0, 200),
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildChapterUserPrompt(req: z.infer<typeof RequestSchema>): string {
  const { brief, outline, chapterNumber, priorChapterSummaries, mediaCaptions, regenHints, toneReferenceText } = req;
  const chars = brief.characters.map((c) => `- ${c.name}: ${c.description}`).join("\n");
  const themes = brief.themes.length ? brief.themes.join(", ") : "(none)";
  const tone = truncateToneReference(toneReferenceText, 2000);
  const toneBlock = tone
    ? `\n\nVoice reference (mimic tone/pacing/vocabulary — do not copy prose verbatim):\n${tone}`
    : "";
  const synopsis =
    outline[chapterNumber - 1]?.synopsis ??
    "(no synopsis — invent a logical next beat)";
  const prior = priorChapterSummaries.length
    ? `\n\nPrior chapters (summaries):\n${priorChapterSummaries
        .map((s, i) => `Ch ${i + 1}: ${s}`)
        .join("\n")}`
    : "";
  const media = mediaCaptions.length
    ? `\n\nMedia to incorporate naturally (creator already uploaded these; reference them at the right narrative beats):\n${mediaCaptions
        .map((m, i) => `[media ${i + 1}] url=${m.url} — caption: ${m.caption}`)
        .join("\n")}\n\n${
        brief.format === "chat"
          ? "For each media item, emit a message with its url set to media_url and media_type set appropriately (image/gif/video). Place them where they fit naturally in the conversation."
          : "Reference the media within the prose at the right moment; do not fabricate media URLs. We will splice images in during rendering."
      }`
    : "";
  const hints = regenHints?.length
    ? `\n\nRegeneration adjustments for this pass:\n${regenHints
        .map((h) => `- ${HINT_TEXT[h]}`)
        .join("\n")}`
    : "";

  return `Write chapter ${chapterNumber} of ${brief.chapterCount} for the story titled "${brief.title}".

Description: ${brief.description}
Themes / kinks: ${themes}
Characters:
${chars}

This chapter's synopsis: ${synopsis}${prior}${media}${hints}${toneBlock}

Return JSON matching the provided response schema. The "summary" field must be 1-2 lines describing what happened this chapter — it will be used as context when generating the next chapter.`;
}
