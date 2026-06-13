"use client";

import { useActionState } from "react";
import { CheckCircle2, FileClock, XCircle } from "lucide-react";
import { submitRecommendationAction } from "@/app/actions/credit";

export function RecommendationForm({ loanId }: { loanId: string }) {
  const [state, action, isPending] = useActionState(submitRecommendationAction, {});

  return (
    <form action={action} className="mt-4 grid gap-4">
      <input name="loanId" type="hidden" value={loanId} />
      <label className="grid gap-2 text-sm font-semibold text-forest">
        Catatan keputusan
        <textarea
          className="min-h-[100px] w-full resize-none rounded-[12px] border border-forest/15 bg-transparent px-4 py-3 text-base text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
          name="note"
          placeholder="Contoh: Disarankan untuk review manager karena risk tinggi."
          rows={3}
        />
      </label>

      {state.message && (
        <p className="rounded-[10px] bg-orange/10 p-3 text-sm font-semibold text-orange">
          {state.message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-lime text-sm font-bold text-forest transition hover:bg-lime/85 disabled:opacity-60"
          disabled={isPending}
          name="recommendation"
          type="submit"
          value="process"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
          Proses
        </button>
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-forest text-sm font-bold text-white transition hover:bg-forest/90 disabled:opacity-60"
          disabled={isPending}
          name="recommendation"
          type="submit"
          value="review"
        >
          <FileClock className="h-4 w-4" strokeWidth={2.25} />
          Review
        </button>
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-orange text-sm font-bold text-white transition hover:bg-orange/90 disabled:opacity-60"
          disabled={isPending}
          name="recommendation"
          type="submit"
          value="reject"
        >
          <XCircle className="h-4 w-4" strokeWidth={2.25} />
          Tolak
        </button>
      </div>
    </form>
  );
}
