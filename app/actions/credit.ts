"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/domain/auth";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export async function grantConsentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["credit", "manager", "admin"]);

  const memberId = String(formData.get("memberId") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "");

  if (!memberId || !tenantId) {
    return { message: "Data consent tidak lengkap." };
  }

  await services.memberConsents.grantConsent(memberId, tenantId, "credit_summary");
  revalidatePath(`/credit/members/${memberId}`);
  return {};
}

export async function createLoanAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const memberId = String(formData.get("memberId") ?? "");
  const principalAmount = Number(formData.get("principalAmount"));
  const purpose = String(formData.get("purpose") ?? "").trim();

  if (!memberId || !principalAmount || !purpose) {
    return { message: "Data pengajuan tidak lengkap." };
  }

  const assessment = await services.creditAssessment.assess(
    memberId,
    session.user.tenantId,
    principalAmount,
  );

  try {
    const loan = await services.loanApplications.create({
      tenantId: session.user.tenantId,
      memberId,
      requestedByUserId: session.user.id,
      principalAmount,
      purpose,
      riskTier: assessment.riskTier,
    });

    revalidatePath("/credit/loans");
    redirect(`/credit/loans/${loan.id}/assess`);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pengajuan pinjaman.",
    };
  }
}

export async function submitRecommendationAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return { message: "Akun tidak terhubung ke koperasi." };
  }

  const loanId = String(formData.get("loanId") ?? "");
  const recommendation = String(formData.get("recommendation") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!loanId || !recommendation) {
    return { message: "Data rekomendasi tidak lengkap." };
  }

  if (!["process", "review", "reject"].includes(recommendation)) {
    return { message: "Rekomendasi tidak valid." };
  }

  const loan = await services.loans.getLoanDetail(loanId);
  if (!loan) {
    return { message: "Pinjaman tidak ditemukan." };
  }

  if (recommendation === "reject") {
    await services.loanApprovals.reject({
      loanId,
      rejectedByUserId: session.user.id,
      note,
    });
    revalidatePath("/credit/loans");
    redirect("/credit/loans");
  }

  // process / review → route to manager approval
  await services.loanApprovals.submitForReview(loanId);

  await services.auditLogs.record({
    actorUserId: session.user.id,
    action: "loan.recommended",
    resourceType: "loan",
      resourceId: loan.loan_number,
    metadata: {
      recommendation,
      note,
      role: session.user.roles.join(","),
    },
  });

  await services.notifications.createForManagers(
    {
      type: "loan_pending_approval",
      title: "Pengajuan pinjaman menunggu approval",
      message: `${loan.loan_number} (${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(loan.principal_amount)}) menunggu keputusan manager.`,
      resource_type: "loan",
      resource_id: loanId,
    },
    session.user.tenantId,
  );

  revalidatePath(`/credit/loans/${loanId}/assess`);
  revalidatePath("/credit/loans");
  revalidatePath("/manager");
  revalidatePath("/manager/approvals");

  redirect("/credit/loans");
}
