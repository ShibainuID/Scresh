"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/domain/auth";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export async function approveLoanAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["manager", "admin"]);

  const loanId = String(formData.get("loanId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!loanId) {
    return { message: "Data pinjaman tidak lengkap." };
  }

  try {
    await services.loanApprovals.approve({
      loanId,
      approvedByUserId: session.user.id,
      note,
    });

    // Sync anomaly after approval (e.g., change near disbursement)
    const loan = await services.loans.getLoanDetail(loanId);
    if (loan) {
      await services.auditRisk.syncAnomalies(loanId, loan.tenant_id);
    }

    revalidatePath("/manager");
    revalidatePath("/manager/approvals");
    revalidatePath("/credit/loans");
    redirect("/manager/approvals");
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyetujui pinjaman.",
    };
  }
}

export async function rejectLoanAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["manager", "admin"]);

  const loanId = String(formData.get("loanId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!loanId) {
    return { message: "Data pinjaman tidak lengkap." };
  }

  try {
    await services.loanApprovals.reject({
      loanId,
      rejectedByUserId: session.user.id,
      note,
    });

    revalidatePath("/manager");
    revalidatePath("/manager/approvals");
    revalidatePath("/credit/loans");
    redirect("/manager/approvals");
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menolak pinjaman.",
    };
  }
}

export async function requestCollateralAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["manager", "admin"]);

  const loanId = String(formData.get("loanId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!loanId) {
    return { message: "Data pinjaman tidak lengkap." };
  }

  try {
    await services.loanApprovals.requestCollateral({
      loanId,
      managerUserId: session.user.id,
      note,
    });

    revalidatePath("/manager");
    revalidatePath("/manager/approvals");
    revalidatePath("/credit/loans");
    redirect("/manager/approvals");
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat meminta jaminan.",
    };
  }
}
