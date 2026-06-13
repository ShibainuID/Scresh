import "server-only";

import type { Database } from "@/lib/server/db/client";

export type LoanVersionRow = {
  id: string;
  loan_id: string;
  version_number: number;
  principal_amount: number;
  change_reason: string;
  changed_by_user_id: string | null;
  changed_by_name: string | null;
  created_at: Date;
};

export type LoanChangeRequestRow = {
  id: string;
  loan_id: string;
  requested_by_user_id: string | null;
  requested_by_name: string | null;
  reviewed_by_user_id: string | null;
  reviewed_by_name: string | null;
  field_name: string;
  old_value: string;
  new_value: string;
  reason: string;
  status: string;
  reviewed_at: Date | null;
  created_at: Date;
};

export type LoanDetailRow = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  member_id: string;
  member_masked_name: string;
  loan_number: string;
  principal_amount: number;
  purpose: string;
  risk_tier: string;
  status: string;
  requested_by_name: string | null;
  approved_by_name: string | null;
  approved_at: Date | null;
  created_at: Date;
};

export class LoanRepository {
  constructor(private readonly db: Database) {}

  async getLoanDetail(loanId: string): Promise<LoanDetailRow | null> {
    const result = await this.db.query(
      `select
        l.id,
        l.tenant_id,
        t.name as tenant_name,
        l.member_id,
        substring(m.full_name from 1 for 1) || '***' || substring(m.full_name from length(m.full_name) for 1) as member_masked_name,
        l.loan_number,
        l.principal_amount,
        l.purpose,
        l.risk_tier,
        l.status,
        req.name as requested_by_name,
        appr.name as approved_by_name,
        l.approved_at,
        l.created_at
      from loans l
      join tenants t on t.id = l.tenant_id
      join members m on m.id = l.member_id
      left join users req on req.id = l.requested_by_user_id
      left join users appr on appr.id = l.approved_by_user_id
      where l.id = $1`,
      [loanId],
    );
    return (result.rows[0] as LoanDetailRow | undefined) ?? null;
  }

  async getLoanVersions(loanId: string): Promise<LoanVersionRow[]> {
    const result = await this.db.query(
      `select
        lv.id,
        lv.loan_id,
        lv.version_number,
        lv.principal_amount,
        lv.change_reason,
        lv.changed_by_user_id,
        u.name as changed_by_name,
        lv.created_at
      from loan_versions lv
      left join users u on u.id = lv.changed_by_user_id
      where lv.loan_id = $1
      order by lv.version_number asc`,
      [loanId],
    );
    return result.rows as LoanVersionRow[];
  }

  async listByTenant(tenantId: string): Promise<
    { id: string; loan_number: string; principal_amount: number; purpose: string; risk_tier: string; status: string; created_at: Date }[]
  > {
    const result = await this.db.query(
      `select id, loan_number, principal_amount, purpose, risk_tier, status, created_at
       from loans
       where tenant_id = $1
       order by created_at desc`,
      [tenantId],
    );
    return result.rows as {
      id: string;
      loan_number: string;
      principal_amount: number;
      purpose: string;
      risk_tier: string;
      status: string;
      created_at: Date;
    }[];
  }

  async getLoanChangeRequests(loanId: string): Promise<LoanChangeRequestRow[]> {
    const result = await this.db.query(
      `select
        lcr.id,
        lcr.loan_id,
        lcr.requested_by_user_id,
        req.name as requested_by_name,
        lcr.reviewed_by_user_id,
        rev.name as reviewed_by_name,
        lcr.field_name,
        lcr.old_value,
        lcr.new_value,
        lcr.reason,
        lcr.status,
        lcr.reviewed_at,
        lcr.created_at
      from loan_change_requests lcr
      left join users req on req.id = lcr.requested_by_user_id
      left join users rev on rev.id = lcr.reviewed_by_user_id
      where lcr.loan_id = $1
      order by lcr.created_at asc`,
      [loanId],
    );
    return result.rows as LoanChangeRequestRow[];
  }
}
