import { describe, expect, test } from "bun:test";
import type { SessionPrincipal } from "@/lib/domain/auth";
import { AiInferenceError } from "@/lib/server/services/ai-inference-service";
import { createScanHandler } from "./handler";

const session: SessionPrincipal = {
  sessionId: "session-1",
  expiresAt: new Date("2030-01-01"),
  user: {
    id: "user-1",
    tenantId: "tenant-1",
    name: "Staff",
    email: "staff@example.com",
    roles: ["staff"],
  },
};

function requestWith(
  commodity: FormDataEntryValue = "chili",
  image: FormDataEntryValue = new File(["image"], "chili.jpg", {
    type: "image/jpeg",
  }),
) {
  const body = new FormData();
  body.set("commodity", commodity);
  body.set("image", image);
  return new Request("http://localhost/api/v1/scresh/scan", {
    method: "POST",
    body,
  });
}

describe("POST /api/v1/scresh/scan", () => {
  test("requires an authenticated session", async () => {
    const handler = createScanHandler({
      getSession: async () => null,
      hasPermission: () => false,
      scan: async () => ({}),
    });

    const response = await handler(requestWith());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("requires the scresh scan permission", async () => {
    const handler = createScanHandler({
      getSession: async () => session,
      hasPermission: () => false,
      scan: async () => ({}),
    });

    const response = await handler(requestWith());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  test("forwards a valid single-photo scan", async () => {
    const scans: Array<{ commodity: string; image: File }> = [];
    const handler = createScanHandler({
      getSession: async () => session,
      hasPermission: () => true,
      scan: async (input) => {
        scans.push(input);
        return { summary: { grade: "A" } };
      },
    });

    const response = await handler(requestWith());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ summary: { grade: "A" } });
    expect(scans[0].commodity).toBe("chili");
    expect(scans[0].image.name).toBe("chili.jpg");
  });

  test("rejects an unsupported commodity", async () => {
    const handler = createScanHandler({
      getSession: async () => session,
      hasPermission: () => true,
      scan: async () => ({}),
    });

    const response = await handler(requestWith("cucumber"));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "Unsupported commodity: cucumber",
    });
  });

  test("maps Azure validation errors to the client", async () => {
    const handler = createScanHandler({
      getSession: async () => session,
      hasPermission: () => true,
      scan: async () => {
        throw new AiInferenceError(422, "No produce objects detected");
      },
    });

    const response = await handler(requestWith());

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "No produce objects detected",
    });
  });
});
