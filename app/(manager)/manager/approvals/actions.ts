"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export async function approveLoanAction(formData: FormData): Promise<void> {
  const session = await requireRole(["manager", "admin"]);
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const loanId = formData.get("loanId");

  if (!tenantId || typeof loanId !== "string") {
    throw new Error("Permintaan tidak valid.");
  }

  await services.loanService.approve(loanId, userId);
  revalidatePath("/manager/approvals");
  revalidatePath("/manager");
}

export async function rejectLoanAction(formData: FormData): Promise<void> {
  const session = await requireRole(["manager", "admin"]);
  const tenantId = session.user.tenantId;
  const loanId = formData.get("loanId");

  if (!tenantId || typeof loanId !== "string") {
    throw new Error("Permintaan tidak valid.");
  }

  await services.loanService.reject(loanId);
  revalidatePath("/manager/approvals");
  revalidatePath("/manager");
}
