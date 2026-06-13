import "server-only";

import type { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import type { Database } from "@/lib/server/db/client";

export class LoanApprovalService {
  constructor(
    private readonly db: Database,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async approve(input: {
    loanId: string;
    approvedByUserId: string;
    note?: string;
  }): Promise<void> {
    const loanResult = await this.db.query(
      `update loans
       set status = 'approved',
           approved_by_user_id = $2,
           approved_at = now(),
           updated_at = now()
       where id = $1
       returning loan_number, status`,
      [input.loanId, input.approvedByUserId],
    );

    const loan = loanResult.rows[0] as { loan_number: string; status: string } | undefined;
    if (!loan) {
      throw new Error("Pinjaman tidak ditemukan.");
    }

    await this.auditLogs.record({
      actorUserId: input.approvedByUserId,
      action: "loan.approved",
      resourceType: "loan",
      resourceId: loan.loan_number,
      metadata: {
        note: input.note,
        status: loan.status,
      },
    });
  }

  async reject(input: {
    loanId: string;
    rejectedByUserId: string;
    note?: string;
  }): Promise<void> {
    const loanResult = await this.db.query(
      `update loans
       set status = 'rejected',
           updated_at = now()
       where id = $1
       returning loan_number, status`,
      [input.loanId],
    );

    const loan = loanResult.rows[0] as { loan_number: string; status: string } | undefined;
    if (!loan) {
      throw new Error("Pinjaman tidak ditemukan.");
    }

    await this.auditLogs.record({
      actorUserId: input.rejectedByUserId,
      action: "loan.rejected",
      resourceType: "loan",
      resourceId: loan.loan_number,
      metadata: {
        note: input.note,
        status: loan.status,
      },
    });
  }

  async requestCollateral(input: {
    loanId: string;
    managerUserId: string;
    note?: string;
  }): Promise<void> {
    const loanResult = await this.db.query(
      `update loans
       set status = 'collateral_requested',
           updated_at = now()
       where id = $1
       returning loan_number, status`,
      [input.loanId],
    );

    const loan = loanResult.rows[0] as { loan_number: string; status: string } | undefined;
    if (!loan) {
      throw new Error("Pinjaman tidak ditemukan.");
    }

    await this.auditLogs.record({
      actorUserId: input.managerUserId,
      action: "loan.collateral_requested",
      resourceType: "loan",
      resourceId: loan.loan_number,
      metadata: {
        note: input.note,
        status: loan.status,
      },
    });
  }

  async submitForReview(loanId: string): Promise<void> {
    await this.db.query(
      `update loans set status = 'pending_review', updated_at = now() where id = $1`,
      [loanId],
    );
  }
}
