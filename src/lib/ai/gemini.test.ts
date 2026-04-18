import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateStructured } from "./gemini";

const ORIGINAL_FETCH = global.fetch;

describe("generateStructured", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("POSTs to the Gemini REST endpoint with safety + responseSchema", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            { content: { parts: [{ text: JSON.stringify({ hello: "world" }) }] }, finishReason: "STOP" },
          ],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateStructured<{ hello: string }>({
      systemPrompt: "sys",
      userPrompt: "hi",
      responseSchema: { type: "object", properties: { hello: { type: "string" } } },
    });

    expect(result.parsed).toEqual({ hello: "world" });
    expect(result.tokensIn).toBe(100);
    expect(result.tokensOut).toBe(50);

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toMatch(/generativelanguage\.googleapis\.com/);
    expect(call[0]).toMatch(/gemini-2\.5-flash/);
    const body = JSON.parse(call[1].body);
    expect(body.systemInstruction.parts[0].text).toBe("sys");
    expect(body.contents[0].parts[0].text).toBe("hi");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toBeDefined();
    expect(body.safetySettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        }),
      ])
    );
  });

  it("throws a SafetyRefusal error when finishReason is SAFETY", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 0 },
        }),
    }) as unknown as typeof fetch;

    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/SAFETY/);
  });

  it("throws when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("internal error"),
    }) as unknown as typeof fetch;

    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/Gemini HTTP 500/);
  });

  it("throws if GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
