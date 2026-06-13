import "server-only";

import type { Database } from "@/lib/server/db/client";

export type AuditReviewRow = {
  id: string;
  loan_id: string;
  reviewer_user_id: string;
  reviewer_name: string;
  status: string;
  note: string | null;
  created_at: Date;
};

export class AuditReviewRepository {
  constructor(private readonly db: Database) {}

  async listByLoan(loanId: string): Promise<AuditReviewRow[]> {
    const result = await this.db.query(
      `select
        ar.id,
        ar.loan_id,
        ar.reviewer_user_id,
        u.name as reviewer_name,
        ar.status,
        ar.note,
        ar.created_at
      from audit_reviews ar
      join users u on u.id = ar.reviewer_user_id
      where ar.loan_id = $1
      order by ar.created_at desc`,
      [loanId],
    );
    return result.rows as AuditReviewRow[];
  }

  async create(input: {
    loanId: string;
    reviewerUserId: string;
    status: string;
    note?: string | null;
  }): Promise<AuditReviewRow> {
    const result = await this.db.query(
      `insert into audit_reviews (loan_id, reviewer_user_id, status, note)
       values ($1, $2, $3, $4)
       returning id, loan_id, reviewer_user_id,
         (select name from users where id = $2) as reviewer_name,
         status, note, created_at`,
      [input.loanId, input.reviewerUserId, input.status, input.note ?? null],
    );
    return result.rows[0] as AuditReviewRow;
  }
}
