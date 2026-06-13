import Link from "next/link";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SupervisorAuditRow } from "@/lib/server/repositories/supervisor-audit-repository";

export function AuditTable({ rows }: { rows: SupervisorAuditRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center text-forest">
        <p className="font-sans text-lg font-semibold">Tidak ada data audit</p>
        <p className="mt-1 text-sm text-forest/70">Coba ubah filter pencarian.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] bg-white">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Pinjaman</th>
              <th className="px-4 py-3 font-semibold">Koperasi</th>
              <th className="px-4 py-3 font-semibold">Field</th>
              <th className="px-4 py-3 font-semibold">Sebelum</th>
              <th className="px-4 py-3 font-semibold">Sesudah</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition hover:bg-lime/30"
              >
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-forest underline underline-offset-4 hover:text-forest/80"
                    href={`/supervisor/audit/${row.loanId}`}
                  >
                    {row.loan}
                  </Link>
                </td>
                <td className="px-4 py-3 text-forest/80">{row.tenantName}</td>
                <td className="px-4 py-3 capitalize">{row.field.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{row.before}</td>
                <td className="px-4 py-3">{row.after}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={row.risk} />
                </td>
                <td className="px-4 py-3 text-forest/70">
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(row.changedAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-forest/10">
        {rows.map((row) => (
          <Link
            key={row.id}
            className="block p-4 transition hover:bg-lime/30"
            href={`/supervisor/audit/${row.loanId}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans font-semibold text-forest">{row.loan}</span>
              <RiskBadge score={row.risk} />
            </div>
            <div className="mt-1 text-xs text-forest/70">{row.tenantName}</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-forest/70">{row.before}</span>
              <span className="text-forest/40">→</span>
              <span className="font-medium text-forest">{row.after}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <StatusBadge status={row.status} />
              <span className="text-xs text-forest/60">
                {new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(row.changedAt))}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
