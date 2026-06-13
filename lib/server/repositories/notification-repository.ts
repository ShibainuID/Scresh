import "server-only";

import type { Database } from "@/lib/server/db/client";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: Date;
};

export class NotificationRepository {
  constructor(private readonly db: Database) {}

  async listUnreadByUser(userId: string, limit = 20): Promise<NotificationRow[]> {
    const result = await this.db.query(
      `select id, user_id, type, title, message, resource_type, resource_id, is_read, created_at
       from notifications
       where user_id = $1
       order by created_at desc
       limit $2`,
      [userId, limit],
    );
    return result.rows as NotificationRow[];
  }

  async countUnreadByUser(userId: string): Promise<number> {
    const result = await this.db.query(
      `select count(*)::int as count from notifications where user_id = $1 and is_read = false`,
      [userId],
    );
    return (result.rows[0] as { count: number }).count ?? 0;
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.db.query(
      `update notifications set is_read = true where id = $1 and user_id = $2`,
      [notificationId, userId],
    );
  }

  async createForManagers(input: Omit<NotificationRow, "id" | "user_id" | "created_at" | "is_read">, tenantId: string): Promise<void> {
    await this.db.query(
      `insert into notifications (user_id, type, title, message, resource_type, resource_id, is_read)
       select u.id, $1, $2, $3, $4, $5, false
       from users u
       join user_roles ur on ur.user_id = u.id
       where u.tenant_id = $6 and ur.role in ('manager', 'admin')`,
      [input.type, input.title, input.message, input.resource_type, input.resource_id, tenantId],
    );
  }

  async create(input: Omit<NotificationRow, "id" | "created_at">): Promise<NotificationRow> {
    const result = await this.db.query(
      `insert into notifications (user_id, type, title, message, resource_type, resource_id, is_read)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, user_id, type, title, message, resource_type, resource_id, is_read, created_at`,
      [input.user_id, input.type, input.title, input.message, input.resource_type, input.resource_id, input.is_read],
    );
    return result.rows[0] as NotificationRow;
  }
}
