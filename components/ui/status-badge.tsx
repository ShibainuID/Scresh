const statusLabels: Record<string, string> = {
  approved: "Disetujui",
  pending: "Menunggu",
  logged: "Tercatat",
  safe: "Aman",
  needs_explanation: "Butuh Penjelasan",
  rejected: "Ditolak",
};

export function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;

  if (status === "approved" || status === "safe") {
    return (
      <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-forest">
        {label}
      </span>
    );
  }

  if (status === "pending" || status === "needs_explanation") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-white">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-forest/20 bg-white px-2.5 py-1 text-xs font-bold text-forest">
      {label}
    </span>
  );
}
