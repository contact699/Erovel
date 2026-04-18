const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
] as const;

export interface GenerateStructuredArgs {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateStructuredResult<T> {
  parsed: T;
  raw: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export class SafetyRefusalError extends Error {
  constructor(public reason: string) {
    super(`Gemini SAFETY refusal: ${reason}`);
    this.name = "SafetyRefusalError";
  }
}

export async function generateStructured<T>(
  args: GenerateStructuredArgs
): Promise<GenerateStructuredResult<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: args.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
    generationConfig: {
      temperature: args.temperature ?? 0.9,
      topP: 0.95,
      maxOutputTokens: args.maxOutputTokens ?? 4000,
      responseMimeType: "application/json",
      responseSchema: args.responseSchema,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const candidate = json.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;

  if (finishReason === "SAFETY" || json.promptFeedback?.blockReason) {
    throw new SafetyRefusalError(
      finishReason ?? json.promptFeedback?.blockReason ?? "unknown"
    );
  }

  const rawText: string = candidate?.content?.parts?.[0]?.text ?? "";
  let parsed: T;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Gemini returned non-JSON (finishReason=${finishReason}): ${String(err)}`
    );
  }

  return {
    parsed,
    raw: rawText,
    tokensIn: json.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: json.usageMetadata?.candidatesTokenCount ?? 0,
    model: GEMINI_MODEL,
  };
}

export type StreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "final";
      rawText: string;
      parsed: unknown;
      tokensIn: number;
      tokensOut: number;
      model: string;
    };

export async function* generateStream(
  args: GenerateStructuredArgs
): AsyncGenerator<StreamEvent, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url =
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:streamGenerateContent` +
    `?alt=sse&key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: args.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
    generationConfig: {
      temperature: args.temperature ?? 0.9,
      topP: 0.95,
      maxOutputTokens: args.maxOutputTokens ?? 4000,
      responseMimeType: "application/json",
      responseSchema: args.responseSchema,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini stream HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let rawText = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let sawSafety = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by \n\n; each frame has one or more `data: ` lines.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      for (const line of frame.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;
        let chunk: unknown;
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue;
        }

        const c = (chunk as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        }).candidates?.[0];
        const deltaText = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (deltaText) {
          rawText += deltaText;
          yield { type: "delta", text: deltaText };
        }
        if (c?.finishReason === "SAFETY") sawSafety = true;

        const um = (chunk as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata;
        if (um) {
          tokensIn = um.promptTokenCount ?? tokensIn;
          tokensOut = um.candidatesTokenCount ?? tokensOut;
        }
      }
    }
  }

  if (sawSafety) {
    throw new SafetyRefusalError("SAFETY");
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Leave parsed as null — route handler may choose to retry or return raw.
  }

  yield {
    type: "final",
    rawText,
    parsed,
    tokensIn,
    tokensOut,
    model: GEMINI_MODEL,
  };
}

export { GEMINI_MODEL };
