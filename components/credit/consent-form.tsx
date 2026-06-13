"use client";

import { useActionState } from "react";
import { queuedGrantConsentAction as grantConsentAction } from "@/lib/client/wrapped-actions";

export function ConsentForm({ memberId, tenantId }: { memberId: string; tenantId: string }) {
  const [state, action, isPending] = useActionState(grantConsentAction, {});

  return (
    <form action={action} className="mt-3">
      <input name="memberId" type="hidden" value={memberId} />
      <input name="tenantId" type="hidden" value={tenantId} />
      <button
        className="h-10 rounded-[10px] bg-forest px-4 text-sm font-bold text-white transition hover:bg-forest/90 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Memproses..." : "Minta Consent"}
      </button>
      {state.message && (
        <p className="mt-2 text-xs font-semibold text-orange">{state.message}</p>
      )}
    </form>
  );
}
