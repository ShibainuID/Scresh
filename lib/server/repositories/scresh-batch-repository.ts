import "server-only";

import type { Database } from "@/lib/server/db/client";

export type ScreshBatchRow = {
  id: string;
  tenant_id: string;
  registered_by_user_id: string | null;
  batch_code: string;
  commodity: string;
  supplier_name: string;
  claimed_weight_kg: number;
  actual_weight_kg: number;
  remaining_weight_kg: number;
  buy_price_per_kg: number;
  sample_photo_url: string | null;
  freshness_grade: string;
  confidence_score: number;
  shelf_life_hours: number;
  storage_location: string | null;
  distribution_priority: number;
  status: string;
  created_at: Date;
};

export type CreateBatchInput = {
  tenantId: string;
  registeredByUserId: string;
  batchCode: string;
  commodity: string;
  supplierName: string;
  claimedWeightKg: number;
  actualWeightKg: number;
  buyPricePerKg: number;
  samplePhotoUrl?: string | null;
  storageLocation?: string | null;
};

export type UpdateFreshnessInput = {
  grade: string;
  confidenceScore: number;
  shelfLifeHours: number;
};

export class ScreshBatchRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateBatchInput): Promise<ScreshBatchRow> {
    const result = await this.db.query<ScreshBatchRow>(
      `
      insert into scresh_batches (
        tenant_id, registered_by_user_id, batch_code, commodity, supplier_name,
        claimed_weight_kg, actual_weight_kg, remaining_weight_kg, buy_price_per_kg,
        sample_photo_url, storage_location,
        freshness_grade, confidence_score, shelf_life_hours, distribution_priority, status
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10,
        'pending', 0, 0, 99, 'pending_scan'
      )
      returning *
      `,
      [
        input.tenantId,
        input.registeredByUserId,
        input.batchCode,
        input.commodity,
        input.supplierName,
        input.claimedWeightKg,
        input.actualWeightKg,
        input.buyPricePerKg,
        input.samplePhotoUrl ?? null,
        input.storageLocation ?? null,
      ],
    );

    return result.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<ScreshBatchRow | null> {
    const result = await this.db.query<ScreshBatchRow>(
      `select * from scresh_batches where tenant_id = $1 and id = $2`,
      [tenantId, id],
    );

    return result.rows[0] ?? null;
  }

  async findByCode(tenantId: string, batchCode: string): Promise<ScreshBatchRow | null> {
    const result = await this.db.query<ScreshBatchRow>(
      `select * from scresh_batches where tenant_id = $1 and batch_code = $2`,
      [tenantId, batchCode],
    );

    return result.rows[0] ?? null;
  }

  async listByTenant(tenantId: string): Promise<ScreshBatchRow[]> {
    const result = await this.db.query<ScreshBatchRow>(
      `select * from scresh_batches where tenant_id = $1 order by created_at desc`,
      [tenantId],
    );

    return result.rows;
  }

  async updateFreshness(
    tenantId: string,
    id: string,
    input: UpdateFreshnessInput,
  ): Promise<ScreshBatchRow | null> {
    const priority = this.derivePriority(input.grade, input.shelfLifeHours);

    const result = await this.db.query<ScreshBatchRow>(
      `
      update scresh_batches
      set freshness_grade = $3,
          confidence_score = $4,
          shelf_life_hours = $5,
          distribution_priority = $6,
          status = case
            when $3 in ('C', 'D') or $5 <= 24 then 'priority_distribution'
            else status
          end
      where tenant_id = $1 and id = $2
      returning *
      `,
      [tenantId, id, input.grade, input.confidenceScore, input.shelfLifeHours, priority],
    );

    return result.rows[0] ?? null;
  }

  async updateRemainingWeight(
    tenantId: string,
    id: string,
    deltaKg: number,
  ): Promise<ScreshBatchRow | null> {
    const result = await this.db.query<ScreshBatchRow>(
      `
      update scresh_batches
      set remaining_weight_kg = greatest(0, remaining_weight_kg - $3)
      where tenant_id = $1 and id = $2
      returning *
      `,
      [tenantId, id, deltaKg],
    );

    return result.rows[0] ?? null;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: string,
  ): Promise<ScreshBatchRow | null> {
    const result = await this.db.query<ScreshBatchRow>(
      `update scresh_batches set status = $3 where tenant_id = $1 and id = $2 returning *`,
      [tenantId, id, status],
    );

    return result.rows[0] ?? null;
  }

  async getNextBatchSequence(tenantId: string, commodityCode: string): Promise<number> {
    const prefix = `${commodityCode}-`;
    const result = await this.db.query<{ seq: number }>(
      `
      select coalesce(max(
        cast(regexp_replace(batch_code, '.*-', '') as integer)
      ), 0) + 1 as seq
      from scresh_batches
      where tenant_id = $1 and batch_code like $2
      `,
      [tenantId, `${prefix}%`],
    );

    return result.rows[0]?.seq ?? 1;
  }

  private derivePriority(grade: string, shelfLifeHours: number): number {
    const gradeOrder: Record<string, number> = { D: 1, C: 2, B: 3, A: 4, pending: 99 };
    const base = gradeOrder[grade] ?? 99;
    if (shelfLifeHours <= 8) return Math.min(base, 1);
    if (shelfLifeHours <= 24) return Math.min(base, 2);
    return base;
  }
}
