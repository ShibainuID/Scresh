import "server-only";

import type { Database } from "@/lib/server/db/client";

export type SupervisorAuditRow = {
  id: string;
  loan: string;
  member: string;
  field: string;
  before: string;
  after: string;
  actor: string;
  reviewer: string;
  status: string;
  risk: number;
  reason: string;
  changedAt: string;
};

type SupervisorAuditQueryRow = {
  id: string;
  loan: string | null;
  member: string | null;
  field: string | null;
  before_value: string | null;
  after_value: string | null;
  actor: string | null;
  reviewer: string | null;
  status: string | null;
  risk: number | null;
  reason: string | null;
  changed_at: Date;
};

export class SupervisorAuditRepository {
  constructor(private readonly db: Database) {}

  async list(limit = 80): Promise<SupervisorAuditRow[]> {
    const result = await this.db.query<SupervisorAuditQueryRow>(
      `
      select
        al.id::text as id,
        al.resource_id as loan,
        coalesce(al.metadata->>'memberMasked', 'M****n') as member,
        coalesce(al.metadata->>'field', 'principal_amount') as field,
        coalesce(al.metadata->>'oldValue', '-') as before_value,
        coalesce(al.metadata->>'newValue', '-') as after_value,
        coalesce(actor.name, 'System') as actor,
        coalesce(
          al.metadata->>'reviewer',
          case
            when al.metadata ? 'approvedByRole' then 'Budi Santoso'
            when al.metadata ? 'requiresManagerApproval' then 'Menunggu manager'
            when al.action = 'loan.change_requested' then 'Menunggu manager'
            when al.action = 'loan.change_approved' then 'Budi Santoso'
            else 'Tidak perlu'
          end
        ) as reviewer,
        coalesce(
          al.metadata->>'approvalStatus',
          case
            when al.metadata ? 'approvedByRole' then 'approved'
            when al.metadata ? 'requiresManagerApproval' then 'pending'
            when al.action = 'loan.change_requested' then 'pending'
            when al.action = 'loan.change_approved' then 'approved'
            else 'logged'
          end
        ) as status,
        coalesce(
          (al.metadata->>'riskScore')::int,
          case
            when al.metadata ? 'requiresManagerApproval' then 65
            when al.metadata ? 'approvedByRole' then 42
            else 18
          end
        ) as risk,
        coalesce(
          al.metadata->>'reason',
          case
            when al.metadata ? 'requiresManagerApproval' then 'Perubahan pinjaman menunggu approval manager'
            when al.metadata ? 'approvedByRole' then 'Perubahan pinjaman sudah disetujui manager'
            else 'Log pemeriksaan perubahan pinjaman'
          end
        ) as reason,
        al.created_at as changed_at
      from audit_logs al
      left join users actor on actor.id = al.actor_user_id
      where al.resource_type = 'loan'
        and al.resource_id like 'L-KMJ-%'
        and al.action in (
          'loan.change_requested',
          'loan.change_approved',
          'audit.anomaly_viewed',
          'loan.audit_dummy'
        )
      order by al.created_at desc
      limit $1
      `,
      [limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      loan: row.loan ?? "-",
      member: row.member ?? "M****n",
      field: row.field ?? "principal_amount",
      before: this.formatValue(row.before_value),
      after: this.formatValue(row.after_value),
      actor: row.actor ?? "System",
      reviewer: row.reviewer ?? "Menunggu",
      status: row.status ?? "logged",
      risk: row.risk ?? 0,
      reason: row.reason ?? "Log audit perubahan pinjaman",
      changedAt: new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(row.changed_at),
    }));
  }

  private formatValue(value: string | null) {
    if (!value) {
      return "-";
    }

    if (/^\d+$/.test(value)) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(Number(value));
    }

    return value;
  }
}
