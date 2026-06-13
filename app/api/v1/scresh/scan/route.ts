import { getSession } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { AiInferenceService } from "@/lib/server/services/ai-inference-service";
import { createScanHandler } from "./handler";

export const POST = createScanHandler({
  getSession,
  hasPermission: (session, permission) =>
    services.rbac.hasPermission(session, permission),
  scan: (input) => AiInferenceService.fromEnvironment().scan(input),
});
