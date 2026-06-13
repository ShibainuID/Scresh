import { describe, expect, test } from "bun:test";
import {
  maskDataUrl,
  parseScanResult,
} from "./scan-result";

test("builds a transparent PNG data URL from the AI mask", () => {
  expect(maskDataUrl("encoded-mask")).toBe(
    "data:image/png;base64,encoded-mask",
  );
});

describe("parseScanResult", () => {
  test("accepts the Azure freshness response", () => {
    const result = parseScanResult({
      commodity: "chili",
      summary: {
        freshness_class: "fresh",
        confidence: 0.91,
        probabilities: {
          fresh: 0.91,
          medium: 0.07,
          rotten: 0.02,
        },
        grade: "A",
        shelf_life_days: 7,
        recommendation: "Excellent freshness.",
        object_count: 3,
      },
      objects: [],
      mask_media_type: "image/png",
      mask_base64: "encoded-mask",
    });

    expect(result.summary.grade).toBe("A");
    expect(result.summary.objectCount).toBe(3);
    expect(result.summary.confidencePercent).toBe(91);
    expect(result.maskBase64).toBe("encoded-mask");
  });

  test("rejects malformed responses", () => {
    expect(() => parseScanResult({ summary: { grade: "A" } })).toThrow(
      "Respons AI tidak valid",
    );
  });
});
