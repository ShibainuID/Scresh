import { describe, expect, test } from "bun:test";
import {
  getAiCommodityKey,
  getDraftCommodityLabel,
  parseScanDraft,
  serializeScanDraft,
} from "./scan-draft";

describe("scan draft", () => {
  test("round trips scan metadata for the new batch form", () => {
    const draft = {
      commodity: "tomato",
      grade: "A" as const,
      confidencePercent: 92,
      shelfLifeDays: 5,
    };

    expect(parseScanDraft(serializeScanDraft(draft))).toEqual(draft);
  });

  test("rejects malformed stored data", () => {
    expect(parseScanDraft('{"grade":"Z"}')).toBeNull();
    expect(parseScanDraft(null)).toBeNull();
  });

  test("maps AI commodity keys to batch form labels", () => {
    expect(getDraftCommodityLabel("tomato")).toBe("Tomat");
    expect(getDraftCommodityLabel("chili")).toBe("Cabai Merah");
  });

  test("maps stored batch labels back to AI commodity keys", () => {
    expect(getAiCommodityKey("Tomat")).toBe("tomato");
    expect(getAiCommodityKey("Cabai Merah")).toBe("chili");
  });
});
