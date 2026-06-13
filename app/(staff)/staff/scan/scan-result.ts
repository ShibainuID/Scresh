type UnknownRecord = Record<string, unknown>;

export type Grade = "A" | "B" | "C" | "D";

export type ScanResult = {
  commodity: string;
  summary: {
    freshnessClass: string;
    confidencePercent: number;
    grade: Grade;
    shelfLifeDays: number;
    recommendation: string;
    objectCount: number;
  };
  visualizationBase64: string;
  visualizationMediaType: "image/png" | "image/jpeg";
};

const SHELF_LIFE_COLD_STORAGE: Record<string, Record<Grade, number>> = {
  lettuce: { A: 14, B: 7, C: 2, D: 0 },
  chili: { A: 14, B: 7, C: 3, D: 0 },
  tomato: { A: 7, B: 4, C: 1, D: 0 },
  potato: { A: 30, B: 14, C: 5, D: 0 },
  onion: { A: 30, B: 14, C: 5, D: 0 },
};

export function getColdStorageShelfLifeDays(
  commodity: string,
  grade: Grade,
): number | null {
  return SHELF_LIFE_COLD_STORAGE[commodity]?.[grade] ?? null;
}

export function getColdStorageRecommendation(
  grade: Grade,
  shelfLifeDays: number,
): string {
  if (grade === "D") {
    return "Tidak layak disimpan. Buang atau tandai sebagai limbah.";
  }
  if (grade === "C") {
    return `Batch rawan. Keluarkan atau proses dalam ${shelfLifeDays} hari.`;
  }
  if (grade === "B") {
    return `Segar baik. Prioritaskan distribusi dalam ${shelfLifeDays} hari.`;
  }
  return `Segar optimal. Aman disimpan di cold storage hingga ${shelfLifeDays} hari.`;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function visualizationDataUrl(
  mediaType: ScanResult["visualizationMediaType"],
  base64: string,
) {
  return `data:${mediaType};base64,${base64}`;
}

export function supportsAnimatedSegmentation(
  mediaType: ScanResult["visualizationMediaType"],
) {
  return mediaType === "image/png";
}

export function getScanErrorMessage(payload: unknown, fallback: string) {
  if (
    isRecord(payload) &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }
  return fallback;
}

export function parseScanResult(payload: unknown): ScanResult {
  if (!isRecord(payload) || !isRecord(payload.summary)) {
    throw new Error("Respons AI tidak valid");
  }

  const { summary } = payload;
  const grade = String(summary.grade) as Grade;
  const hasMask =
    payload.mask_media_type === "image/png" &&
    typeof payload.mask_base64 === "string";
  const hasOverlay =
    payload.overlay_media_type === "image/jpeg" &&
    typeof payload.overlay_base64 === "string";
  if (
    typeof payload.commodity !== "string" ||
    !["A", "B", "C", "D"].includes(grade) ||
    typeof summary.freshness_class !== "string" ||
    typeof summary.confidence !== "number" ||
    typeof summary.shelf_life_days !== "number" ||
    typeof summary.recommendation !== "string" ||
    typeof summary.object_count !== "number" ||
    (!hasMask && !hasOverlay)
  ) {
    throw new Error("Respons AI tidak valid");
  }

  const commodity = payload.commodity;
  const shelfLifeDays =
    getColdStorageShelfLifeDays(commodity, grade) ??
    Math.max(0, Math.round(summary.shelf_life_days));
  const recommendation = getColdStorageRecommendation(grade, shelfLifeDays);

  return {
    commodity,
    summary: {
      freshnessClass: summary.freshness_class,
      confidencePercent: Math.round(summary.confidence * 100),
      grade,
      shelfLifeDays,
      recommendation,
      objectCount: summary.object_count,
    },
    visualizationBase64: hasMask
      ? (payload.mask_base64 as string)
      : (payload.overlay_base64 as string),
    visualizationMediaType: hasMask ? "image/png" : "image/jpeg",
  };
}
