import "server-only";

import type { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import type { Database } from "@/lib/server/db/client";
import type { CreditAssessment } from "./credit-assessment-service";

export class LoanApplicationService {
  constructor(
    private readonly db: Database,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async create(input: {
    tenantId: string;
    memberId: string;
    requestedByUserId: string;
    principalAmount: number;
    purpose: string;
    riskTier: CreditAssessment["riskTier"];
  }): Promise<{ id: string; loanNumber: string }> {
    const loanNumber = await this.generateLoanNumber(input.tenantId);

    const loanResult = await this.db.query<{ id: string }>(
      `insert into loans (
        tenant_id,
        member_id,
        requested_by_user_id,
        loan_number,
        principal_amount,
        purpose,
        risk_tier,
        status
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning id`,
      [
        input.tenantId,
        input.memberId,
        input.requestedByUserId,
        loanNumber,
        input.principalAmount,
        input.purpose,
        input.riskTier,
        input.riskTier === "low" ? "pending_review" : "pending_review",
      ],
    );

    const loanId = loanResult.rows[0].id;

    await this.db.query(
      `insert into loan_versions (loan_id, version_number, principal_amount, change_reason, changed_by_user_id)
       values ($1, 1, $2, $3, $4)`,
      [loanId, input.principalAmount, "Pengajuan awal pinjaman", input.requestedByUserId],
    );

    await this.auditLogs.record({
      actorUserId: input.requestedByUserId,
      action: "loan.created",
      resourceType: "loan",
      resourceId: loanNumber,
      metadata: {
        memberId: input.memberId,
        principalAmount: input.principalAmount,
        riskTier: input.riskTier,
      },
    });

    return { id: loanId, loanNumber };
  }

  private async generateLoanNumber(tenantId: string): Promise<string> {
    const tenantResult = await this.db.query<{ slug: string }>(
      `select slug from tenants where id = $1`,
      [tenantId],
    );
    const slugPrefix = tenantResult.rows[0]?.slug
      .split("-")
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "KMJ";

    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

    const countResult = await this.db.query<{ count: number }>(
      `select count(*)::int as count from loans where tenant_id = $1 and created_at::date = current_date`,
      [tenantId],
    );
    const sequence = String((countResult.rows[0]?.count ?? 0) + 1).padStart(3, "0");

    return `L-${slugPrefix}-${datePart}-${sequence}`;
  }
}
