import "server-only";

import type {
  ScreshBatchRepository,
  ScreshBatchRow,
} from "@/lib/server/repositories/scresh-batch-repository";
import type {
  ScreshMovementRepository,
  ScreshMovementRow,
} from "@/lib/server/repositories/scresh-movement-repository";
import type { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";

const VALID_MOVEMENT_TYPES = ["distribution", "waste", "return", "claim"];

export type RegisterBatchInput = {
  tenantId: string;
  registeredByUserId: string;
  commodity: string;
  commodityCode: string;
  supplierName: string;
  claimedWeightKg: number;
  actualWeightKg: number;
  buyPricePerKg: number;
  samplePhotoUrl?: string | null;
  storageLocation?: string | null;
};

export type RecordMovementInput = {
  tenantId: string;
  movedByUserId: string;
  batchId: string;
  movementType: string;
  quantityKg: number;
  destination: string;
  notes?: string | null;
};

export type FreshnessScanInput = {
  tenantId: string;
  batchId: string;
  grade: string;
  confidenceScore: number;
  shelfLifeHours: number;
};

export class ScreshService {
  constructor(
    private readonly batches: ScreshBatchRepository,
    private readonly movements: ScreshMovementRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async registerBatch(input: RegisterBatchInput): Promise<ScreshBatchRow> {
    const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seq = await this.batches.getNextBatchSequence(input.tenantId, input.commodityCode);
    const batchCode = `${input.commodityCode}-${dateSuffix}-${String(seq).padStart(3, "0")}`;

    const batch = await this.batches.create({
      tenantId: input.tenantId,
      registeredByUserId: input.registeredByUserId,
      batchCode,
      commodity: input.commodity,
      supplierName: input.supplierName,
      claimedWeightKg: input.claimedWeightKg,
      actualWeightKg: input.actualWeightKg,
      buyPricePerKg: input.buyPricePerKg,
      samplePhotoUrl: input.samplePhotoUrl,
      storageLocation: input.storageLocation,
    });

    await this.auditLogs.record({
      actorUserId: input.registeredByUserId,
      action: "scresh.batch.registered",
      resourceType: "batch",
      resourceId: batch.batch_code,
      metadata: {
        commodity: input.commodity,
        supplierName: input.supplierName,
        claimedWeightKg: input.claimedWeightKg,
        actualWeightKg: input.actualWeightKg,
        weightDeltaKg: Number((input.actualWeightKg - input.claimedWeightKg).toFixed(2)),
        buyPricePerKg: input.buyPricePerKg,
      },
    });

    return batch;
  }

  async scanFreshness(input: FreshnessScanInput): Promise<ScreshBatchRow> {
    const batch = await this.batches.findById(input.tenantId, input.batchId);

    if (!batch) {
      throw new Error("Batch tidak ditemukan.");
    }

    const updated = await this.batches.updateFreshness(input.tenantId, input.batchId, {
      grade: input.grade,
      confidenceScore: input.confidenceScore,
      shelfLifeHours: input.shelfLifeHours,
    });

    if (!updated) {
      throw new Error("Gagal memperbarui hasil scan.");
    }

    await this.auditLogs.record({
      actorUserId: null,
      action: "scresh.freshness.scanned",
      resourceType: "batch",
      resourceId: batch.batch_code,
      metadata: {
        grade: input.grade,
        confidenceScore: input.confidenceScore,
        shelfLifeHours: input.shelfLifeHours,
      },
    });

    return updated;
  }

  async recordMovement(input: RecordMovementInput): Promise<ScreshBatchRow> {
    const batch = await this.batches.findById(input.tenantId, input.batchId);

    if (!batch) {
      throw new Error("Batch tidak ditemukan.");
    }

    if (!VALID_MOVEMENT_TYPES.includes(input.movementType)) {
      throw new Error("Jenis pergerakan stok tidak valid.");
    }

    if (input.quantityKg <= 0) {
      throw new Error("Jumlah harus lebih dari 0 kg.");
    }

    if (input.quantityKg > batch.remaining_weight_kg) {
      throw new Error("Jumlah melebihi sisa stok batch.");
    }

    await this.movements.create({
      batchId: input.batchId,
      movedByUserId: input.movedByUserId,
      movementType: input.movementType,
      quantityKg: input.quantityKg,
      destination: input.destination,
      notes: input.notes,
    });

    const updated = await this.batches.updateRemainingWeight(
      input.tenantId,
      input.batchId,
      input.quantityKg,
    );

    if (!updated) {
      throw new Error("Gagal memperbarui stok.");
    }

    if (updated.remaining_weight_kg === 0) {
      await this.batches.updateStatus(input.tenantId, input.batchId, "depleted");
    }

    await this.auditLogs.record({
      actorUserId: input.movedByUserId,
      action: `scresh.movement.${input.movementType}`,
      resourceType: "batch",
      resourceId: batch.batch_code,
      metadata: {
        movementType: input.movementType,
        quantityKg: input.quantityKg,
        destination: input.destination,
        remainingWeightKg: updated.remaining_weight_kg,
      },
    });

    return updated;
  }

  async getBatch(tenantId: string, batchId: string): Promise<ScreshBatchRow | null> {
    return this.batches.findById(tenantId, batchId);
  }

  async getBatchByCode(tenantId: string, batchCode: string): Promise<ScreshBatchRow | null> {
    return this.batches.findByCode(tenantId, batchCode);
  }

  async listBatches(tenantId: string): Promise<ScreshBatchRow[]> {
    return this.batches.listByTenant(tenantId);
  }

  async listMovements(tenantId: string): Promise<ScreshMovementRow[]> {
    return this.movements.listByTenant(tenantId);
  }

  async getMovementSummary(tenantId: string) {
    return this.movements.getMovementSummary(tenantId);
  }
}
