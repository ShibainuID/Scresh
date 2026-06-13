"use client";

import { useActionState } from "react";
import { createLoanAction } from "@/app/actions/credit";

export function LoanApplicationForm({
  members,
  selectedMemberId,
}: {
  members: { id: string; full_name: string; national_id: string | null }[];
  selectedMemberId?: string;
}) {
  const [state, action, isPending] = useActionState(createLoanAction, {});

  return (
    <form action={action} className="rounded-[24px] bg-white p-6">
      <div className="grid gap-6">
        <label className="grid gap-2 text-base font-semibold text-forest">
          Anggota
          <select
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition focus:border-forest focus:ring-0"
            name="memberId"
            required
            defaultValue={selectedMemberId ?? ""}
          >
            <option value="">Pilih anggota</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} — {member.national_id ?? "-"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-base font-semibold text-forest">
          Nominal pinjaman (Rp)
          <input
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-forest/50 focus:border-forest focus:ring-0"
            min="100000"
            name="principalAmount"
            placeholder="5000000"
            required
            step="10000"
            type="number"
          />
        </label>

        <label className="grid gap-2 text-base font-semibold text-forest">
          Tujuan pinjaman
          <input
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-forest/50 focus:border-forest focus:ring-0"
            name="purpose"
            placeholder="Contoh: Modal kerja pembelian cabai"
            required
            type="text"
          />
        </label>
      </div>

      {state.message && (
        <p className="mt-4 rounded-[10px] bg-orange/10 p-3 text-sm font-semibold text-orange">
          {state.message}
        </p>
      )}

      <button
        className="mt-8 h-14 w-full rounded-[10px] bg-forest text-base font-bold text-white transition hover:bg-forest/90 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Memproses..." : "Lanjutkan Assessment"}
      </button>
    </form>
  );
}
