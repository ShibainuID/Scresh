import { describe, expect, test } from "bun:test";
import {
  AiInferenceError,
  AiInferenceService,
} from "./ai-inference-service";

const image = new File(["image"], "chili.jpg", { type: "image/jpeg" });

describe("AiInferenceService", () => {
  test("forwards one photo and shared secret to Azure", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return Response.json({ summary: { grade: "A" } });
    };
    const service = new AiInferenceService(
      {
        baseUrl: "http://104.214.171.213/",
        token: "secret",
        timeoutMs: 5_000,
      },
      fetcher,
    );

    const result = await service.scan({ commodity: "chili", image });

    expect(result).toEqual({ summary: { grade: "A" } });
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toBe(
      "http://104.214.171.213/infer/freshness",
    );
    expect(calls[0].init?.headers).toEqual({
      "X-AI-Service-Token": "secret",
    });

    const body = calls[0].init?.body as FormData;
    expect(body.get("commodity")).toBe("chili");
    const forwardedImage = body.get("image");
    expect(forwardedImage).toBeInstanceOf(File);
    expect((forwardedImage as File).name).toBe("chili.jpg");
    expect((forwardedImage as File).type).toBe("image/jpeg");
    expect((forwardedImage as File).size).toBe(image.size);
  });

  test("preserves an AI service validation response", async () => {
    const fetcher = async () =>
      Response.json(
        { detail: "No produce objects detected" },
        { status: 422 },
      );
    const service = new AiInferenceService(
      { baseUrl: "http://ai.test", token: "secret", timeoutMs: 5_000 },
      fetcher,
    );

    await expect(
      service.scan({ commodity: "chili", image }),
    ).rejects.toEqual(
      new AiInferenceError(422, "No produce objects detected"),
    );
  });

  test("returns service unavailable when Azure cannot be reached", async () => {
    const fetcher = async () => {
      throw new TypeError("fetch failed");
    };
    const service = new AiInferenceService(
      { baseUrl: "http://ai.test", token: "secret", timeoutMs: 5_000 },
      fetcher,
    );

    await expect(
      service.scan({ commodity: "chili", image }),
    ).rejects.toEqual(
      new AiInferenceError(503, "AI service is unavailable"),
    );
  });

  test("rejects missing server configuration", () => {
    expect(() =>
      AiInferenceService.fromEnvironment({
        AI_SERVICE_URL: "",
        AI_SERVICE_TOKEN: "",
      }),
    ).toThrow("AI service is not configured");
  });
});
