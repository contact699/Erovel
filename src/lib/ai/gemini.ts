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

export { GEMINI_MODEL };
