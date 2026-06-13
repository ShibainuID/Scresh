import "server-only";

import type { Database } from "@/lib/server/db/client";

export type CreditSummaryRow = {
  id: string;
  member_id: string;
  tenant_id: string;
  tenant_name: string;
  active_arrears_count: number;
  running_loan_count: number;
  on_time_ratio: number;
  risk_tier: string;
  last_updated: Date;
};

export class CreditSummaryRepository {
  constructor(private readonly db: Database) {}

  async getSummary(memberId: string, tenantId: string): Promise<CreditSummaryRow | null> {
    const result = await this.db.query(
      `select
        cs.id,
        cs.member_id,
        cs.tenant_id,
        t.name as tenant_name,
        cs.active_arrears_count,
        cs.running_loan_count,
        cs.on_time_ratio,
        cs.risk_tier,
        cs.last_updated
      from credit_summaries cs
      join tenants t on t.id = cs.tenant_id
      where cs.member_id = $1 and cs.tenant_id = $2`,
      [memberId, tenantId],
    );
    return (result.rows[0] as CreditSummaryRow | undefined) ?? null;
  }

  async listCrossCooperativeSummary(
    memberId: string,
    excludeTenantId: string,
  ): Promise<CreditSummaryRow[]> {
    const result = await this.db.query(
      `select
        cs.id,
        cs.member_id,
        cs.tenant_id,
        t.name as tenant_name,
        cs.active_arrears_count,
        cs.running_loan_count,
        cs.on_time_ratio,
        cs.risk_tier,
        cs.last_updated
      from credit_summaries cs
      join tenants t on t.id = cs.tenant_id
      where cs.member_id = $1 and cs.tenant_id <> $2`,
      [memberId, excludeTenantId],
    );
    return result.rows as CreditSummaryRow[];
  }

  async upsert(input: {
    memberId: string;
    tenantId: string;
    activeArrearsCount: number;
    runningLoanCount: number;
    onTimeRatio: number;
    riskTier: string;
  }): Promise<CreditSummaryRow> {
    const result = await this.db.query(
      `insert into credit_summaries (member_id, tenant_id, active_arrears_count, running_loan_count, on_time_ratio, risk_tier)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (member_id, tenant_id) do update set
         active_arrears_count = excluded.active_arrears_count,
         running_loan_count = excluded.running_loan_count,
         on_time_ratio = excluded.on_time_ratio,
         risk_tier = excluded.risk_tier,
         last_updated = now()
       returning id, member_id, tenant_id, (select name from tenants where id = $2) as tenant_name,
         active_arrears_count, running_loan_count, on_time_ratio, risk_tier, last_updated`,
      [input.memberId, input.tenantId, input.activeArrearsCount, input.runningLoanCount, input.onTimeRatio, input.riskTier],
    );
    return result.rows[0] as CreditSummaryRow;
  }
}
