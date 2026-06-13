import "server-only";

import type { Database } from "@/lib/server/db/client";

export type AnomalyReason = {
  score: number;
  reason: string;
};

export class AuditRiskService {
  constructor(private readonly db: Database) {}

  async evaluateLoan(loanId: string): Promise<AnomalyReason[]> {
    const reasons: AnomalyReason[] = [];

    const [loanResult, versionsResult, changeRequestsResult] = await Promise.all([
      this.db.query(
        `select principal_amount, approved_at, created_at from loans where id = $1`,
        [loanId],
      ),
      this.db.query(
        `select version_number, principal_amount, created_at from loan_versions where loan_id = $1 order by version_number asc`,
        [loanId],
      ),
      this.db.query(
        `select requested_by_user_id, reviewed_by_user_id, created_at, reviewed_at from loan_change_requests where loan_id = $1 order by created_at asc`,
        [loanId],
      ),
    ]);

    const loan = loanResult.rows[0] as { principal_amount: number; approved_at: Date | null; created_at: Date } | undefined;
    const versions = versionsResult.rows as { version_number: number; principal_amount: number; created_at: Date }[];
    const changeRequests = changeRequestsResult.rows as { requested_by_user_id: string; reviewed_by_user_id: string | null; created_at: Date; reviewed_at: Date | null }[];

    if (!loan) return reasons;

    // Rule: large value jump > 50%
    if (versions.length >= 2) {
      const previous = versions[versions.length - 2].principal_amount;
      const current = versions[versions.length - 1].principal_amount;
      if (previous > 0 && current > previous * 1.5) {
        const pct = Math.round(((current - previous) / previous) * 100);
        reasons.push({ score: Math.min(95, 70 + pct / 5), reason: `Nilai pinjaman naik ${pct}%` });
      }
    }

    // Rule: change near disbursement (< 24h)
    if (loan.approved_at) {
      const lastChange = versions.length > 0 ? versions[versions.length - 1].created_at : loan.created_at;
      const hoursBefore = (loan.approved_at.getTime() - new Date(lastChange).getTime()) / 36e5;
      if (hoursBefore >= 0 && hoursBefore < 24) {
        reasons.push({ score: 80, reason: `Diubah ${Math.round(hoursBefore)} jam sebelum pencairan` });
      }
    }

    // Rule: approval too fast (< 60 seconds)
    for (const cr of changeRequests) {
      if (cr.reviewed_at && cr.requested_by_user_id !== cr.reviewed_by_user_id) {
        const seconds = (new Date(cr.reviewed_at).getTime() - new Date(cr.created_at).getTime()) / 1000;
        if (seconds > 0 && seconds < 60) {
          reasons.push({ score: 70, reason: `Approve ${Math.round(seconds)} detik setelah request` });
        }
      }
    }

    // Rule: excessive changes (> 3 in 7 days)
    if (versions.length > 3) {
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 7);
      const recentVersions = versions.filter((v) => new Date(v.created_at) >= windowStart);
      if (recentVersions.length > 3) {
        reasons.push({ score: 65, reason: `Diubah ${recentVersions.length}× dalam 7 hari terakhir` });
      }
    }

    return reasons.sort((a, b) => b.score - a.score);
  }

  async evaluateTenantWideRules(tenantId: string): Promise<Map<string, AnomalyReason[]>> {
    const result = new Map<string, AnomalyReason[]>();

    // Dominant approver: one manager approved > 80% of approved change requests in tenant
    const totalApprovedResult = await this.db.query(
      `select count(*)::int as total
       from loan_change_requests lcr
       join loans l on l.id = lcr.loan_id
       where l.tenant_id = $1 and lcr.status = 'approved' and lcr.reviewed_by_user_id is not null`,
      [tenantId],
    );
    const totalApproved = (totalApprovedResult.rows[0] as { total: number } | undefined)?.total ?? 0;

    if (totalApproved >= 5) {
      const approverResult = await this.db.query(
        `select
          lcr.reviewed_by_user_id,
          u.name,
          count(*)::int as count
        from loan_change_requests lcr
        join loans l on l.id = lcr.loan_id
        join users u on u.id = lcr.reviewed_by_user_id
        where l.tenant_id = $1 and lcr.status = 'approved' and lcr.reviewed_by_user_id is not null
        group by lcr.reviewed_by_user_id, u.name`,
        [tenantId],
      );

      for (const row of approverResult.rows as { reviewed_by_user_id: string; name: string; count: number }[]) {
        const pct = Math.round((row.count / totalApproved) * 100);
        if (pct >= 80) {
          const loanResult = await this.db.query(
            `select l.id from loans l
             join loan_change_requests lcr on lcr.loan_id = l.id
             where l.tenant_id = $1 and lcr.reviewed_by_user_id = $2 and lcr.status = 'approved'
             order by lcr.reviewed_at desc
             limit 1`,
            [tenantId, row.reviewed_by_user_id],
          );
          const loanId = (loanResult.rows[0] as { id: string } | undefined)?.id;
          if (loanId) {
            const list = result.get(loanId) ?? [];
            list.push({ score: 75, reason: `${row.name} mendominasi ${pct}% approval` });
            result.set(loanId, list);
          }
        }
      }
    }

    // Recurring pair: same staff + manager pair on >= 3 change requests
    const pairResult = await this.db.query(
      `select
        lcr.requested_by_user_id,
        req.name as staff_name,
        lcr.reviewed_by_user_id,
        rev.name as manager_name,
        count(*)::int as pair_count
      from loan_change_requests lcr
      join loans l on l.id = lcr.loan_id
      join users req on req.id = lcr.requested_by_user_id
      join users rev on rev.id = lcr.reviewed_by_user_id
      where l.tenant_id = $1
        and lcr.requested_by_user_id <> lcr.reviewed_by_user_id
      group by lcr.requested_by_user_id, req.name, lcr.reviewed_by_user_id, rev.name
      having count(*) >= 3`,
      [tenantId],
    );

    for (const row of pairResult.rows as { requested_by_user_id: string; staff_name: string; reviewed_by_user_id: string; manager_name: string; pair_count: number }[]) {
      const loanResult = await this.db.query(
        `select l.id from loans l
         join loan_change_requests lcr on lcr.loan_id = l.id
         where l.tenant_id = $1
           and lcr.requested_by_user_id = $2
           and lcr.reviewed_by_user_id = $3
         order by lcr.created_at desc
         limit 1`,
        [tenantId, row.requested_by_user_id, row.reviewed_by_user_id],
      );
      const loanId = (loanResult.rows[0] as { id: string } | undefined)?.id;
      if (loanId) {
        const list = result.get(loanId) ?? [];
        list.push({ score: 70, reason: `${row.staff_name} & ${row.manager_name} berpasangan ${row.pair_count}×` });
        result.set(loanId, list);
      }
    }

    return result;
  }

  async syncAnomalies(loanId: string, tenantId: string): Promise<void> {
    const reasons = await this.evaluateLoan(loanId);
    const tenantReasons = await this.evaluateTenantWideRules(tenantId);
    const extraReasons = tenantReasons.get(loanId) ?? [];
    const allReasons = [...reasons, ...extraReasons].sort((a, b) => b.score - a.score);

    if (allReasons.length === 0) {
      await this.db.query(
        `update audit_anomalies set status = 'resolved' where loan_id = $1 and tenant_id = $2`,
        [loanId, tenantId],
      );
      return;
    }

    const topReason = allReasons[0];
    await this.db.query(
      `insert into audit_anomalies (tenant_id, loan_id, risk_score, reason, status)
       values ($1, $2, $3, $4, 'open')
       on conflict (tenant_id, loan_id) do update set
         risk_score = excluded.risk_score,
         reason = excluded.reason,
         status = 'open'`,
      [tenantId, loanId, topReason.score, topReason.reason],
    );
  }

  async syncAllTenantAnomalies(tenantId: string): Promise<void> {
    const loansResult = await this.db.query(
      `select id from loans where tenant_id = $1`,
      [tenantId],
    );

    for (const row of loansResult.rows as { id: string }[]) {
      await this.syncAnomalies(row.id, tenantId);
    }
  }
}
