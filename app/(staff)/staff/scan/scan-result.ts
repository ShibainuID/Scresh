type UnknownRecord = Record<string, unknown>;

export type ScanResult = {
  commodity: string;
  summary: {
    freshnessClass: string;
    confidencePercent: number;
    grade: "A" | "B" | "C" | "D";
    shelfLifeDays: number;
    recommendation: string;
    objectCount: number;
  };
  maskBase64: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function maskDataUrl(maskBase64: string) {
  return `data:image/png;base64,${maskBase64}`;
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
  const grade = summary.grade;
  if (
    typeof payload.commodity !== "string" ||
    !["A", "B", "C", "D"].includes(String(grade)) ||
    typeof summary.freshness_class !== "string" ||
    typeof summary.confidence !== "number" ||
    typeof summary.shelf_life_days !== "number" ||
    typeof summary.recommendation !== "string" ||
    typeof summary.object_count !== "number" ||
    typeof payload.mask_base64 !== "string"
  ) {
    throw new Error("Respons AI tidak valid");
  }

  return {
    commodity: payload.commodity,
    summary: {
      freshnessClass: summary.freshness_class,
      confidencePercent: Math.round(summary.confidence * 100),
      grade: grade as ScanResult["summary"]["grade"],
      shelfLifeDays: summary.shelf_life_days,
      recommendation: summary.recommendation,
      objectCount: summary.object_count,
    },
    maskBase64: payload.mask_base64,
  };
}
