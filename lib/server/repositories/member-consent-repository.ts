import "server-only";

import type { Database } from "@/lib/server/db/client";

export type MemberConsentRow = {
  id: string;
  member_id: string;
  tenant_id: string;
  purpose: string;
  granted: boolean;
  granted_at: Date | null;
  expires_at: Date | null;
};

export class MemberConsentRepository {
  constructor(private readonly db: Database) {}

  async getConsent(memberId: string, tenantId: string, purpose = "credit_summary"): Promise<MemberConsentRow | null> {
    const result = await this.db.query(
      `select id, member_id, tenant_id, purpose, granted, granted_at, expires_at
       from member_consents
       where member_id = $1 and tenant_id = $2 and purpose = $3`,
      [memberId, tenantId, purpose],
    );
    return (result.rows[0] as MemberConsentRow | undefined) ?? null;
  }

  async grantConsent(memberId: string, tenantId: string, purpose = "credit_summary"): Promise<MemberConsentRow> {
    const result = await this.db.query(
      `insert into member_consents (member_id, tenant_id, purpose, granted, granted_at, expires_at)
       values ($1, $2, $3, true, now(), now() + interval '1 year')
       on conflict (member_id, tenant_id, purpose) do update set
         granted = true,
         granted_at = now(),
         expires_at = now() + interval '1 year'
       returning id, member_id, tenant_id, purpose, granted, granted_at, expires_at`,
      [memberId, tenantId, purpose],
    );
    return result.rows[0] as MemberConsentRow;
  }

  async revokeConsent(memberId: string, tenantId: string, purpose = "credit_summary"): Promise<void> {
    await this.db.query(
      `update member_consents set granted = false where member_id = $1 and tenant_id = $2 and purpose = $3`,
      [memberId, tenantId, purpose],
    );
  }
}
