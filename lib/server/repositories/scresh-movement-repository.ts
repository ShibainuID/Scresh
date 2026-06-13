import "server-only";

import type { Database } from "@/lib/server/db/client";

export type ScreshMovementRow = {
  id: string;
  batch_id: string;
  moved_by_user_id: string | null;
  movement_type: string;
  quantity_kg: number;
  destination: string;
  notes: string | null;
  created_at: Date;
};

export type CreateMovementInput = {
  batchId: string;
  movedByUserId: string;
  movementType: string;
  quantityKg: number;
  destination: string;
  notes?: string | null;
};

export class ScreshMovementRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateMovementInput): Promise<ScreshMovementRow> {
    const result = await this.db.query<ScreshMovementRow>(
      `
      insert into scresh_movements (batch_id, moved_by_user_id, movement_type, quantity_kg, destination, notes)
      values ($1, $2, $3, $4, $5, $6)
      returning *
      `,
      [
        input.batchId,
        input.movedByUserId,
        input.movementType,
        input.quantityKg,
        input.destination,
        input.notes ?? null,
      ],
    );

    return result.rows[0];
  }

  async listByTenant(tenantId: string): Promise<ScreshMovementRow[]> {
    const result = await this.db.query<ScreshMovementRow>(
      `
      select sm.*
      from scresh_movements sm
      join scresh_batches b on b.id = sm.batch_id
      where b.tenant_id = $1
      order by sm.created_at desc
      `,
      [tenantId],
    );

    return result.rows;
  }

  async listByBatch(tenantId: string, batchId: string): Promise<ScreshMovementRow[]> {
    const result = await this.db.query<ScreshMovementRow>(
      `
      select sm.*
      from scresh_movements sm
      join scresh_batches b on b.id = sm.batch_id
      where b.tenant_id = $1 and sm.batch_id = $2
      order by sm.created_at desc
      `,
      [tenantId, batchId],
    );

    return result.rows;
  }

  async getMovementSummary(tenantId: string): Promise<{
    total_outbound_kg: number;
    total_waste_kg: number;
    total_return_kg: number;
    total_claim_kg: number;
  }> {
    const result = await this.db.query<{
      total_outbound_kg: number;
      total_waste_kg: number;
      total_return_kg: number;
      total_claim_kg: number;
    }>(
      `
      select
        coalesce(sum(case when sm.movement_type in ('distribution', 'outbound') then sm.quantity_kg else 0 end), 0) as total_outbound_kg,
        coalesce(sum(case when sm.movement_type = 'waste' then sm.quantity_kg else 0 end), 0) as total_waste_kg,
        coalesce(sum(case when sm.movement_type = 'return' then sm.quantity_kg else 0 end), 0) as total_return_kg,
        coalesce(sum(case when sm.movement_type = 'claim' then sm.quantity_kg else 0 end), 0) as total_claim_kg
      from scresh_movements sm
      join scresh_batches b on b.id = sm.batch_id
      where b.tenant_id = $1
      `,
      [tenantId],
    );

    return (
      result.rows[0] ?? {
        total_outbound_kg: 0,
        total_waste_kg: 0,
        total_return_kg: 0,
        total_claim_kg: 0,
      }
    );
  }
}
