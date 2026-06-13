"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActionState } from "@/lib/domain/auth";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

const COMMODITY_CODES: Record<string, string> = {
  "Cabai Merah": "KMJ-CBI",
  "Cabai Rawit": "KMJ-CRW",
  Tomat: "KMJ-TMT",
  Selada: "KMJ-SLD",
  Timun: "KMJ-TMN",
  Terong: "KMJ-TRG",
  Wortel: "KMJ-WRT",
};

export async function registerBatchAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const commodity = String(formData.get("commodity") ?? "").trim();
  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const claimedWeightKg = Number(formData.get("claimedWeightKg"));
  const actualWeightKg = Number(formData.get("actualWeightKg"));
  const buyPricePerKg = Number(formData.get("buyPricePerKg"));
  const storageLocation = String(formData.get("storageLocation") ?? "").trim() || undefined;
  const photo = formData.get("samplePhoto") as File | null;

  if (!commodity || !supplierName || !claimedWeightKg || !actualWeightKg || !buyPricePerKg) {
    return { message: "Semua field wajib diisi." };
  }

  if (actualWeightKg <= 0 || claimedWeightKg <= 0 || buyPricePerKg <= 0) {
    return { message: "Berat dan harga harus lebih dari 0." };
  }

  const scanGrade = String(formData.get("scanGrade") ?? "").toUpperCase();
  const scanConfidencePercent = Number(
    formData.get("scanConfidencePercent"),
  );
  const scanShelfLifeDays = Number(formData.get("scanShelfLifeDays"));
  const hasScanDraft = Boolean(scanGrade);

  if (
    hasScanDraft &&
    (
      !["A", "B", "C", "D"].includes(scanGrade) ||
      !Number.isFinite(scanConfidencePercent) ||
      scanConfidencePercent < 0 ||
      scanConfidencePercent > 100 ||
      !Number.isFinite(scanShelfLifeDays) ||
      scanShelfLifeDays < 0
    )
  ) {
    return { message: "Data hasil scan tidak valid." };
  }

  let samplePhotoUrl: string | null = null;

  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "batches");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await photo.arrayBuffer());
    await writeFile(join(uploadDir, fileName), buffer);
    samplePhotoUrl = `/uploads/batches/${fileName}`;
  }

  let batchId: string;
  try {
    const batch = await services.scresh.registerBatch({
      tenantId: session.user.tenantId,
      registeredByUserId: session.user.id,
      commodity,
      commodityCode: COMMODITY_CODES[commodity] ?? "KMJ-SYR",
      supplierName,
      claimedWeightKg,
      actualWeightKg,
      buyPricePerKg,
      samplePhotoUrl,
      storageLocation,
    });
    batchId = batch.id;

    revalidatePath("/staff/batches");
    if (hasScanDraft) {
      await services.scresh.scanFreshness({
        tenantId: session.user.tenantId,
        batchId: batch.id,
        grade: scanGrade,
        confidenceScore: scanConfidencePercent,
        shelfLifeHours: scanShelfLifeDays * 24,
      });
    }
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mendaftarkan batch.",
    };
  }

  redirect(
    hasScanDraft
      ? `/staff/batches/${batchId}/tag`
      : `/staff/batches/${batchId}/scan`,
  );
}

export async function scanFreshnessAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const batchId = String(formData.get("batchId") ?? "");
  const grade = String(formData.get("grade") ?? "").toUpperCase();
  const confidenceScore = Number(formData.get("confidenceScore"));
  const shelfLifeHours = Number(formData.get("shelfLifeHours"));

  if (!batchId || !grade || !confidenceScore || !shelfLifeHours) {
    return { message: "Data scan tidak lengkap." };
  }

  if (!["A", "B", "C", "D"].includes(grade)) {
    return { message: "Grade harus A, B, C, atau D." };
  }

  try {
    await services.scresh.scanFreshness({
      tenantId: session.user.tenantId,
      batchId,
      grade,
      confidenceScore,
      shelfLifeHours,
    });

    revalidatePath("/staff/batches");
    return {};
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan hasil scan.",
    };
  }
}

export async function saveScanResultAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const commodity = String(formData.get("commodity") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").toUpperCase();
  const confidenceScore = Number(formData.get("confidenceScore"));
  const shelfLifeHours = Number(formData.get("shelfLifeHours"));

  if (!commodity || !grade || !confidenceScore || !shelfLifeHours) {
    return { message: "Data scan tidak lengkap." };
  }

  if (!["A", "B", "C", "D"].includes(grade)) {
    return { message: "Grade harus A, B, C, atau D." };
  }

  try {
    const batch = await services.scresh.registerBatch({
      tenantId: session.user.tenantId,
      registeredByUserId: session.user.id,
      commodity,
      commodityCode: COMMODITY_CODES[commodity] ?? "KMJ-SYR",
      supplierName: "Auto-detected",
      claimedWeightKg: 0,
      actualWeightKg: 0,
      buyPricePerKg: 0,
    });

    await services.scresh.scanFreshness({
      tenantId: session.user.tenantId,
      batchId: batch.id,
      grade,
      confidenceScore,
      shelfLifeHours,
    });

    revalidatePath("/staff/batches");
    redirect(`/staff/batches/${batch.id}/tag`);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan hasil scan.",
    };
  }
}

export async function recordMovementAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const batchId = String(formData.get("batchId") ?? "");
  const movementType = String(formData.get("movementType") ?? "");
  const quantityKg = Number(formData.get("quantityKg"));
  const destination = String(formData.get("destination") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!batchId || !movementType || !quantityKg || !destination) {
    return { message: "Data pergerakan stok tidak lengkap." };
  }

  try {
    await services.scresh.recordMovement({
      tenantId: session.user.tenantId,
      movedByUserId: session.user.id,
      batchId,
      movementType,
      quantityKg,
      destination,
      notes,
    });

    revalidatePath("/staff/batches");
    revalidatePath("/staff/movements");
    redirect("/staff/movements");
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mencatat pergerakan stok.",
    };
  }
}
