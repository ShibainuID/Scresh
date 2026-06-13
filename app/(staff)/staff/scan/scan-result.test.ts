import { describe, expect, test } from "bun:test";
import {
  getColdStorageRecommendation,
  getColdStorageShelfLifeDays,
  getScanErrorMessage,
  parseScanResult,
  supportsAnimatedSegmentation,
  visualizationDataUrl,
} from "./scan-result";

test("builds a transparent PNG data URL from the AI mask", () => {
  expect(visualizationDataUrl("image/png", "encoded-mask")).toBe(
    "data:image/png;base64,encoded-mask",
  );
});

test("animates transparent segmentation masks only", () => {
  expect(supportsAnimatedSegmentation("image/png")).toBe(true);
  expect(supportsAnimatedSegmentation("image/jpeg")).toBe(false);
});

describe("getScanErrorMessage", () => {
  test("preserves a validation error returned by the scan API", () => {
    expect(
      getScanErrorMessage(
        { error: "No produce objects detected" },
        "Analisis foto gagal.",
      ),
    ).toBe("No produce objects detected");
  });

  test("uses a fallback for malformed error responses", () => {
    expect(getScanErrorMessage({}, "Analisis foto gagal.")).toBe(
      "Analisis foto gagal.",
    );
  });
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
    expect(result.visualizationBase64).toBe("encoded-mask");
    expect(result.visualizationMediaType).toBe("image/png");
  });

  test("accepts the deployed Azure response without a mask overlay", () => {
    const result = parseScanResult({
      commodity: "lettuce",
      summary: {
        freshness_class: "fresh",
        confidence: 0.87,
        grade: "A",
        shelf_life_days: 5,
        recommendation: "Excellent freshness.",
        object_count: 2,
      },
      objects: [],
      overlay_media_type: "image/jpeg",
      overlay_base64: "encoded-overlay",
    });

    expect(result.visualizationBase64).toBe("encoded-overlay");
    expect(result.visualizationMediaType).toBe("image/jpeg");
  });

  test("rejects malformed responses", () => {
    expect(() => parseScanResult({ summary: { grade: "A" } })).toThrow(
      "Respons AI tidak valid",
    );
  });

  test("maps chili grade A to 14 cold-storage days", () => {
    const result = parseScanResult({
      commodity: "chili",
      summary: {
        freshness_class: "fresh",
        confidence: 0.91,
        grade: "A",
        shelf_life_days: 7,
        recommendation: "Excellent freshness.",
        object_count: 3,
      },
      objects: [],
      mask_media_type: "image/png",
      mask_base64: "encoded-mask",
    });

    expect(result.summary.shelfLifeDays).toBe(14);
    expect(result.summary.recommendation).toContain("14 hari");
  });

  test("maps potato grade D to 0 cold-storage days", () => {
    const result = parseScanResult({
      commodity: "potato",
      summary: {
        freshness_class: "rotten",
        confidence: 0.78,
        grade: "D",
        shelf_life_days: 14,
        recommendation: "Excellent freshness.",
        object_count: 1,
      },
      objects: [],
      overlay_media_type: "image/jpeg",
      overlay_base64: "encoded-overlay",
    });

    expect(result.summary.shelfLifeDays).toBe(0);
    expect(result.summary.recommendation).toContain("limbah");
  });
});

describe("cold storage shelf life helpers", () => {
  test("returns days for known commodity and grade", () => {
    expect(getColdStorageShelfLifeDays("lettuce", "A")).toBe(14);
    expect(getColdStorageShelfLifeDays("tomato", "C")).toBe(1);
  });

  test("returns null for unknown commodity", () => {
    expect(getColdStorageShelfLifeDays("banana", "A")).toBeNull();
  });

  test("generates Indonesian recommendation", () => {
    expect(getColdStorageRecommendation("A", 14)).toContain("cold storage");
    expect(getColdStorageRecommendation("C", 2)).toContain("rawan");
    expect(getColdStorageRecommendation("D", 0)).toContain("limbah");
  });
});
