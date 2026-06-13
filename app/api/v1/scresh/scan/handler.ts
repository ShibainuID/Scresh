import { NextResponse } from "next/server";
import type { SessionPrincipal } from "@/lib/domain/auth";
import { AiInferenceError } from "@/lib/server/services/ai-inference-service";

const supportedCommodities = new Set([
  "lettuce",
  "chili",
  "potato",
  "onion",
  "tomato",
]);
const supportedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxImageBytes = 10 * 1024 * 1024;

type ScanInput = {
  commodity: string;
  image: File;
};

type ScanHandlerDependencies = {
  getSession: () => Promise<SessionPrincipal | null>;
  hasPermission: (
    session: SessionPrincipal,
    permission: string,
  ) => boolean;
  scan: (input: ScanInput) => Promise<unknown>;
};

function validationError(message: string, status = 422) {
  return NextResponse.json({ error: message }, { status });
}

export function createScanHandler(dependencies: ScanHandlerDependencies) {
  return async function POST(request: Request) {
    const session = await dependencies.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!dependencies.hasPermission(session, "scresh:scan")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return validationError("Request must be multipart/form-data", 400);
    }

    const commodityEntry = formData.get("commodity");
    const imageEntry = formData.get("image");
    if (typeof commodityEntry !== "string" || !commodityEntry.trim()) {
      return validationError("Commodity is required");
    }
    if (!(imageEntry instanceof File)) {
      return validationError("Image is required");
    }

    const commodity = commodityEntry.trim().toLowerCase();
    if (!supportedCommodities.has(commodity)) {
      return validationError(`Unsupported commodity: ${commodity}`);
    }
    if (!supportedMediaTypes.has(imageEntry.type)) {
      return validationError("Image must be JPEG, PNG, or WebP", 415);
    }
    if (imageEntry.size > maxImageBytes) {
      return validationError("Image exceeds 10 MB limit", 413);
    }

    try {
      const result = await dependencies.scan({
        commodity,
        image: imageEntry,
      });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AiInferenceError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      return NextResponse.json(
        { error: "AI service request failed" },
        { status: 500 },
      );
    }
  };
}
