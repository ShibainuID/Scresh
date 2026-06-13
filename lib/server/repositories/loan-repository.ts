import "server-only";

import type { Database } from "@/lib/server/db/client";

export type PendingLoanApplication = {
  id: string;
  loanNumber: string;
  memberName: string;
  creditOfficerName: string;
  principalAmount: number;
  purpose: string;
  riskTier: string;
  createdAt: Date;
};

export class LoanRepository {
  constructor(private readonly db: Database) {}

  async listPendingApplications(
    tenantId: string,
  ): Promise<PendingLoanApplication[]> {
    const result = await this.db.query<PendingLoanApplication>(
      `
      select
        l.id,
        l.loan_number as "loanNumber",
        m.full_name as "memberName",
        coalesce(u.name, u.email) as "creditOfficerName",
        l.principal_amount as "principalAmount",
        l.purpose,
        l.risk_tier as "riskTier",
        l.created_at as "createdAt"
      from loans l
      join members m on m.id = l.member_id
      left join users u on u.id = l.requested_by_user_id
      where l.tenant_id = $1
        and l.status = 'pending_review'
      order by l.created_at desc
      `,
      [tenantId],
    );
    return result.rows;
  }

  async countPendingApplications(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `select count(*) as count from loans where tenant_id = $1 and status = 'pending_review'`,
      [tenantId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async approve(loanId: string, approvedByUserId: string): Promise<void> {
    await this.db.query(
      `
      update loans
      set status = 'approved',
          approved_by_user_id = $2,
          approved_at = now(),
          updated_at = now()
      where id = $1
      `,
      [loanId, approvedByUserId],
    );
  }

  async reject(loanId: string): Promise<void> {
    await this.db.query(
      `
      update loans
      set status = 'rejected',
          updated_at = now()
      where id = $1
      `,
      [loanId],
    );
  }
}
