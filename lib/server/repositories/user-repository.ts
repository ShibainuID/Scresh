import "server-only";

import { normalizeRoles, type Role, type UserPrincipal } from "@/lib/domain/auth";
import type { Database } from "@/lib/server/db/client";

type UserRow = {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  roles: Role[] | null;
};

export type UserWithPassword = UserPrincipal & {
  passwordHash: string;
  isActive: boolean;
};

export class UserRepository {
  constructor(private readonly db: Database) {}

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    tenantId?: string | null;
  }) {
    const user = await this.db.query<{ id: string }>(
      `
      insert into users (name, email, password_hash, tenant_id)
      values ($1, $2, $3, $4)
      returning id
      `,
      [input.name, input.email, input.passwordHash, input.tenantId ?? null],
    );

    await this.db.query(
      `
      insert into user_roles (user_id, role)
      values ($1, $2)
      on conflict do nothing
      `,
      [user.rows[0].id, input.role],
    );

    return this.findById(user.rows[0].id);
  }

  async findByEmail(email: string) {
    const result = await this.db.query<UserRow>(
      `
      select
        u.id,
        u.tenant_id,
        u.name,
        u.email,
        u.password_hash,
        u.is_active,
        coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}') as roles
      from users u
      left join user_roles ur on ur.user_id = u.id
      where lower(u.email) = lower($1)
      group by u.id
      limit 1
      `,
      [email],
    );

    return this.toUserWithPassword(result.rows[0]);
  }

  async findById(id: string) {
    const result = await this.db.query<UserRow>(
      `
      select
        u.id,
        u.tenant_id,
        u.name,
        u.email,
        u.password_hash,
        u.is_active,
        coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}') as roles
      from users u
      left join user_roles ur on ur.user_id = u.id
      where u.id = $1
      group by u.id
      limit 1
      `,
      [id],
    );

    return this.toUserWithPassword(result.rows[0]);
  }

  async list(limit = 50) {
    const result = await this.db.query<UserRow>(
      `
      select
        u.id,
        u.tenant_id,
        u.name,
        u.email,
        u.password_hash,
        u.is_active,
        coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}') as roles
      from users u
      left join user_roles ur on ur.user_id = u.id
      group by u.id
      order by u.created_at desc
      limit $1
      `,
      [limit],
    );

    return result.rows
      .map((row) => this.toUserWithPassword(row))
      .filter((user): user is UserWithPassword => user !== null);
  }

  private toUserWithPassword(row?: UserRow): UserWithPassword | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      isActive: row.is_active,
      roles: normalizeRoles(row.roles),
    };
  }
}
