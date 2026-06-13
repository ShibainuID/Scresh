import "server-only";

import type { Database } from "@/lib/server/db/client";

export class AuditLogRepository {
  constructor(private readonly db: Database) {}

  async record(input: {
    actorUserId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.db.query(
      `
      insert into audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
      values ($1, $2, $3, $4, $5)
      `,
      [
        input.actorUserId ?? null,
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  }
}
