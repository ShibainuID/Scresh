"use client";

import { useActionState } from "react";
import { CheckCircle2, FileClock, XCircle } from "lucide-react";
import { approveLoanAction, rejectLoanAction, requestCollateralAction } from "@/app/actions/manager";

export function ManagerDecisionForm({ loanId, isHighRisk }: { loanId: string; isHighRisk: boolean }) {
  const [approveState, approveAction, approvePending] = useActionState(approveLoanAction, {});
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectLoanAction, {});
  const [collateralState, collateralAction, collateralPending] = useActionState(requestCollateralAction, {});

  return (
    <div className="mt-4 space-y-4">
      <form action={approveAction} className="grid gap-4">
        <input name="loanId" type="hidden" value={loanId} />
        <label className="grid gap-2 text-sm font-semibold text-forest">
          Catatan keputusan
          <textarea
            className="min-h-[100px] w-full resize-none rounded-[12px] border border-forest/15 bg-transparent px-4 py-3 text-base text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
            name="note"
            placeholder="Contoh: Disetujui berdasarkan credit summary dan riwayat lancar."
            rows={3}
          />
        </label>

        {(approveState.message || rejectState.message || collateralState.message) && (
          <p className="rounded-[10px] bg-orange/10 p-3 text-sm font-semibold text-orange">
            {approveState.message || rejectState.message || collateralState.message}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-lime text-sm font-bold text-forest transition hover:bg-lime/85 disabled:opacity-60"
            disabled={approvePending || rejectPending || collateralPending}
            type="submit"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
            {approvePending ? "Memproses..." : "Setuju"}
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-forest text-sm font-bold text-white transition hover:bg-forest/90 disabled:opacity-60"
            disabled={approvePending || rejectPending || collateralPending}
            formAction={collateralAction}
            type="submit"
          >
            <FileClock className="h-4 w-4" strokeWidth={2.25} />
            {collateralPending ? "Memproses..." : "Minta Jaminan"}
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-orange text-sm font-bold text-white transition hover:bg-orange/90 disabled:opacity-60"
            disabled={approvePending || rejectPending || collateralPending}
            formAction={rejectAction}
            type="submit"
          >
            <XCircle className="h-4 w-4" strokeWidth={2.25} />
            {rejectPending ? "Memproses..." : "Tolak"}
          </button>
        </div>
      </form>
      {isHighRisk && (
        <p className="text-xs text-forest/70">
          * Pinjaman high risk disarankan untuk minta jaminan tambahan sebelum disetujui.
        </p>
      )}
    </div>
  );
}
