import "server-only";

import type { Database } from "@/lib/server/db/client";

export type MemberRow = {
  id: string;
  tenant_id: string;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  commodity_focus: string | null;
  membership_status: string;
  created_at: Date;
};

export type MemberWithTenant = MemberRow & {
  tenant_name: string;
};

export class MemberRepository {
  constructor(private readonly db: Database) {}

  async findById(memberId: string): Promise<MemberRow | null> {
    const result = await this.db.query(
      `select id, tenant_id, full_name, national_id, phone, commodity_focus, membership_status, created_at
       from members where id = $1`,
      [memberId],
    );
    return (result.rows[0] as MemberRow | undefined) ?? null;
  }

  async listByTenant(tenantId: string, search?: string): Promise<MemberWithTenant[]> {
    let sql = `select
        m.id,
        m.tenant_id,
        m.full_name,
        m.national_id,
        m.phone,
        m.commodity_focus,
        m.membership_status,
        m.created_at,
        t.name as tenant_name
      from members m
      join tenants t on t.id = m.tenant_id
      where m.tenant_id = $1`;
    const params: (string | undefined)[] = [tenantId];

    if (search) {
      sql += ` and (
        m.full_name ilike $2
        or m.national_id ilike $2
        or m.phone ilike $2
      )`;
      params.push(`%${search}%`);
    }

    sql += ` order by m.full_name asc`;

    const result = await this.db.query(sql, params);
    return result.rows as MemberWithTenant[];
  }

  async findByNationalIdAcrossTenants(nationalId: string): Promise<MemberWithTenant[]> {
    const result = await this.db.query(
      `select
        m.id,
        m.tenant_id,
        m.full_name,
        m.national_id,
        m.phone,
        m.commodity_focus,
        m.membership_status,
        m.created_at,
        t.name as tenant_name
      from members m
      join tenants t on t.id = m.tenant_id
      where m.national_id = $1
      order by t.name asc`,
      [nationalId],
    );
    return result.rows as MemberWithTenant[];
  }

  async getLoanHistory(memberId: string, tenantId: string): Promise<
    {
      id: string;
      loan_number: string;
      principal_amount: number;
      purpose: string;
      risk_tier: string;
      status: string;
      approved_at: Date | null;
      created_at: Date;
    }[]
  > {
    const result = await this.db.query(
      `select id, loan_number, principal_amount, purpose, risk_tier, status, approved_at, created_at
       from loans
       where member_id = $1 and tenant_id = $2
       order by created_at desc`,
      [memberId, tenantId],
    );
    return result.rows as {
      id: string;
      loan_number: string;
      principal_amount: number;
      purpose: string;
      risk_tier: string;
      status: string;
      approved_at: Date | null;
      created_at: Date;
    }[];
  }
}
