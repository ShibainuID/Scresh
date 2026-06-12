import "server-only";

import type { SessionPrincipal } from "@/lib/domain/auth";
import type { Database } from "@/lib/server/db/client";

type SessionRow = {
  session_id: string;
  expires_at: Date;
  user_id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  roles: string[] | null;
};

export class SessionRepository {
  constructor(private readonly db: Database) {}

  async create(userId: string, expiresAt: Date) {
    const result = await this.db.query<{ id: string }>(
      `
      insert into sessions (user_id, expires_at)
      values ($1, $2)
      returning id
      `,
      [userId, expiresAt],
    );

    return result.rows[0].id;
  }

  async findActiveById(id: string): Promise<SessionPrincipal | null> {
    const result = await this.db.query<SessionRow>(
      `
      select
        s.id as session_id,
        s.expires_at,
        u.id as user_id,
        u.tenant_id,
        u.name,
        u.email,
        coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}') as roles
      from sessions s
      join users u on u.id = s.user_id
      left join user_roles ur on ur.user_id = u.id
      where s.id = $1
        and s.revoked_at is null
        and s.expires_at > now()
        and u.is_active = true
      group by s.id, u.id
      limit 1
      `,
      [id],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      sessionId: row.session_id,
      expiresAt: row.expires_at,
      user: {
        id: row.user_id,
        tenantId: row.tenant_id,
        name: row.name,
        email: row.email,
        roles: (row.roles ?? []) as SessionPrincipal["user"]["roles"],
      },
    };
  }

  async revoke(id: string) {
    await this.db.query(
      `
      update sessions
      set revoked_at = now()
      where id = $1 and revoked_at is null
      `,
      [id],
    );
  }
}
