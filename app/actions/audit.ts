"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/domain/auth";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export async function markNotificationReadAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["supervisor", "admin"]);
  const notificationId = String(formData.get("notificationId") ?? "");

  if (!notificationId) {
    return { message: "Notifikasi tidak ditemukan." };
  }

  await services.notifications.markRead(notificationId, session.user.id);
  revalidatePath("/supervisor");
  return {};
}

export async function addAuditReviewAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["supervisor", "admin"]);

  const loanId = String(formData.get("loanId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!loanId || !status) {
    return { message: "Data review tidak lengkap." };
  }

  if (!["safe", "needs_explanation"].includes(status)) {
    return { message: "Status review tidak valid." };
  }

  try {
    await services.auditReviews.create({
      loanId,
      reviewerUserId: session.user.id,
      status,
      note,
    });

    revalidatePath(`/supervisor/audit/${loanId}`);
    revalidatePath("/supervisor/audit");
    return {};
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan review.",
    };
  }
}
