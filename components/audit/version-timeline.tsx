import type { LoanVersionRow } from "@/lib/server/repositories/loan-repository";

export function VersionTimeline({ versions }: { versions: LoanVersionRow[] }) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-forest/70">Tidak ada riwayat versi.</p>
    );
  }

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-0 left-[7px] top-0 w-0.5 bg-forest/15" />
      {versions.map((version, index) => {
        const prevAmount = index > 0 ? versions[index - 1].principal_amount : null;
        const currentAmount = version.principal_amount;
        const changed = prevAmount !== null && prevAmount !== currentAmount;

        return (
          <div key={version.id} className="relative mb-5 pl-6">
            <div className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${changed ? "border-orange bg-orange" : "border-lime bg-lime"}`} />
            <div className="rounded-[16px] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-forest">
                  Versi {version.version_number}
                </span>
                <span className="text-xs text-forest/60">
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(version.created_at))}
                </span>
              </div>
              <div className="mt-1 text-lg font-semibold text-forest">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(currentAmount)}
              </div>
              {changed && prevAmount !== null && (
                <div className="mt-1 text-sm text-orange">
                  {currentAmount > prevAmount ? "Naik" : "Turun"}{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(Math.abs(currentAmount - prevAmount))}
                </div>
              )}
              <p className="mt-2 text-sm text-forest/70">{version.change_reason}</p>
              {version.changed_by_name && (
                <p className="mt-1 text-xs text-forest/50">Oleh: {version.changed_by_name}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
