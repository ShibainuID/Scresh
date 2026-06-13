import "server-only";

import type { Database } from "@/lib/server/db/client";

export type SupervisorAuditRow = {
  id: string;
  loanId: string | null;
  loan: string;
  tenantId: string;
  tenantName: string;
  member: string;
  field: string;
  before: string;
  after: string;
  actor: string;
  reviewer: string;
  status: string;
  risk: number;
  reason: string;
  changedAt: Date;
};

export type AuditFilters = {
  search?: string;
  tenantId?: string;
  status?: string;
  riskMin?: number;
  riskMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
};

export class SupervisorAuditRepository {
  constructor(private readonly db: Database) {}

  async list(filters: AuditFilters = {}, limit = 100): Promise<SupervisorAuditRow[]> {
    const conditions: string[] = [
      "al.resource_type = 'loan'",
      "al.resource_id like 'L-KMJ-%'",
      "al.action in ('loan.change_requested', 'loan.change_approved', 'audit.anomaly_viewed', 'loan.audit_dummy')",
    ];
    const params: (string | number | Date)[] = [];
    let paramIndex = 1;

    if (filters.search) {
      conditions.push(`(al.resource_id ilike $${paramIndex} or t.name ilike $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.tenantId) {
      conditions.push(`l.tenant_id = $${paramIndex}`);
      params.push(filters.tenantId);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`coalesce(al.metadata->>'approvalStatus', 'logged') = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.riskMin !== undefined) {
      conditions.push(`coalesce((al.metadata->>'riskScore')::int, 0) >= $${paramIndex}`);
      params.push(filters.riskMin);
      paramIndex++;
    }

    if (filters.riskMax !== undefined) {
      conditions.push(`coalesce((al.metadata->>'riskScore')::int, 100) <= $${paramIndex}`);
      params.push(filters.riskMax);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`al.created_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`al.created_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    if (filters.minAmount !== undefined) {
      conditions.push(`l.principal_amount >= $${paramIndex}`);
      params.push(filters.minAmount);
      paramIndex++;
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(`l.principal_amount <= $${paramIndex}`);
      params.push(filters.maxAmount);
      paramIndex++;
    }

    const whereClause = conditions.join(" and ");
    params.push(limit);

    const result = await this.db.query(
      `select
        al.id::text as id,
        al.resource_id as loan,
        l.id as loan_id,
        l.tenant_id,
        t.name as tenant_name,
        coalesce(al.metadata->>'memberMasked', substring(m.full_name from 1 for 1) || '***' || substring(m.full_name from length(m.full_name) for 1)) as member,
        coalesce(al.metadata->>'field', 'principal_amount') as field,
        coalesce(al.metadata->>'oldValue', '-') as before_value,
        coalesce(al.metadata->>'newValue', '-') as after_value,
        coalesce(actor.name, 'System') as actor,
        coalesce(al.metadata->>'reviewer', case when al.metadata ? 'approvedByRole' then 'Manager' when al.action = 'loan.change_approved' then 'Manager' when al.metadata ? 'requiresManagerApproval' then 'Menunggu manager' else 'Tidak perlu' end) as reviewer,
        coalesce(al.metadata->>'approvalStatus', case when al.metadata ? 'approvedByRole' then 'approved' when al.action = 'loan.change_approved' then 'approved' when al.metadata ? 'requiresManagerApproval' then 'pending' when al.action = 'loan.change_requested' then 'pending' else 'logged' end) as status,
        coalesce((al.metadata->>'riskScore')::int, case when al.metadata ? 'requiresManagerApproval' then 65 when al.metadata ? 'approvedByRole' then 42 else 18 end) as risk,
        coalesce(al.metadata->>'reason', 'Log pemeriksaan perubahan pinjaman') as reason,
        al.created_at as changed_at
      from audit_logs al
      left join users actor on actor.id = al.actor_user_id
      left join loans l on l.loan_number = al.resource_id
      left join tenants t on t.id = l.tenant_id
      left join members m on m.id = l.member_id
      where ${whereClause}
      order by al.created_at desc
      limit $${paramIndex}`,
      params,
    );

    type QueryRow = {
      id: string;
      loan_id: string;
      loan: string;
      tenant_id: string;
      tenant_name: string;
      member: string;
      field: string;
      before_value: string | null;
      after_value: string | null;
      actor: string;
      reviewer: string;
      status: string;
      risk: number;
      reason: string;
      changed_at: Date;
    };

    return (result.rows as QueryRow[]).map((row) => ({
      id: row.id,
      loanId: row.loan_id,
      loan: row.loan,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      member: row.member,
      field: row.field,
      before: this.formatValue(row.before_value),
      after: this.formatValue(row.after_value),
      actor: row.actor,
      reviewer: row.reviewer,
      status: row.status,
      risk: row.risk,
      reason: row.reason,
      changedAt: row.changed_at,
    }));
  }

  async getAnomalyByLoan(loanId: string): Promise<{ risk_score: number; reason: string; status: string } | null> {
    const result = await this.db.query(
      `select risk_score, reason, status from audit_anomalies where loan_id = $1`,
      [loanId],
    );
    return (result.rows[0] as { risk_score: number; reason: string; status: string } | undefined) ?? null;
  }

  async getCounts(): Promise<{
    activeAnomalies: number;
    needsExplanation: number;
    safeCount: number;
    pendingApproval: number;
  }> {
    const [anomalyResult, reviewResult, pendingResult] = await Promise.all([
      this.db.query(`select count(*)::int as count from audit_anomalies where status = 'open'`),
      this.db.query(`select count(*)::int as count from audit_reviews where status = 'needs_explanation'`),
      this.db.query(`select count(*)::int as count from loan_change_requests where status = 'pending'`),
    ]);

    return {
      activeAnomalies: (anomalyResult.rows[0] as { count: number }).count ?? 0,
      needsExplanation: (reviewResult.rows[0] as { count: number }).count ?? 0,
      safeCount: 0,
      pendingApproval: (pendingResult.rows[0] as { count: number }).count ?? 0,
    };
  }

  private formatValue(value: string | null) {
    if (!value) return "-";
    const numeric = Number(value.replace(/[^\d]/g, ""));
    if (!isNaN(numeric) && numeric.toString() === value.replace(/[^\d]/g, "")) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(numeric);
    }
    return value;
  }
}
