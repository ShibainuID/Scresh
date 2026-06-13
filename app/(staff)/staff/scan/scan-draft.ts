export const SCAN_DRAFT_STORAGE_KEY = "scresh:new-batch-scan";

export type ScanDraft = {
  commodity: string;
  grade: "A" | "B" | "C" | "D";
  confidencePercent: number;
  shelfLifeDays: number;
};

const commodityLabels: Record<string, string> = {
  chili: "Cabai Merah",
  lettuce: "Selada",
  onion: "Bawang",
  potato: "Kentang",
  tomato: "Tomat",
};

const commodityKeys = Object.fromEntries(
  Object.entries(commodityLabels).map(([key, label]) => [
    label.toLowerCase(),
    key,
  ]),
);

export function getDraftCommodityLabel(commodity: string) {
  return commodityLabels[commodity] ?? commodity;
}

export function getAiCommodityKey(commodity: string) {
  const normalized = commodity.trim().toLowerCase();
  return commodityKeys[normalized] ?? normalized;
}

export function serializeScanDraft(draft: ScanDraft) {
  return JSON.stringify(draft);
}

export function parseScanDraft(value: string | null): ScanDraft | null {
  if (!value) return null;

  try {
    const draft: unknown = JSON.parse(value);
    if (
      typeof draft !== "object" ||
      draft === null ||
      !("commodity" in draft) ||
      typeof draft.commodity !== "string" ||
      !("grade" in draft) ||
      !["A", "B", "C", "D"].includes(String(draft.grade)) ||
      !("confidencePercent" in draft) ||
      typeof draft.confidencePercent !== "number" ||
      !("shelfLifeDays" in draft) ||
      typeof draft.shelfLifeDays !== "number"
    ) {
      return null;
    }

    return draft as ScanDraft;
  } catch {
    return null;
  }
}
