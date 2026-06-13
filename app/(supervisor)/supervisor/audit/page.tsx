import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Download,
  EyeOff,
  FileClock,
  FileSearch,
} from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function SupervisorAuditPage() {
  await requireRole(["supervisor", "admin"]);
  const auditRows = await services.supervisorAudits.list(80);
  const highRiskCount = auditRows.filter((row) => row.risk >= 70).length;
  const pendingApprovalCount = auditRows.filter(
    (row) => row.status === "pending" && row.risk < 70,
  ).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
              href="/supervisor"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              Kembali
            </Link>
            <div className="flex items-center gap-3">
              <div>
                <h1>Catatan Aktivitas</h1>
              </div>
            </div>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-sm font-bold text-forest ring-1 ring-forest/10 transition hover:opacity-90"
            type="button"
          >
            <Download className="h-4 w-4" strokeWidth={2.25} />
            Export report
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={FileSearch}
            label="Perubahan pinjaman masuk audit"
            value={String(auditRows.length)}
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Perlu ditindaklanjuti auditor"
            value={String(highRiskCount)}
          />
          <SummaryCard
            icon={Clock3}
            label="Menunggu approval manager"
            value={String(pendingApprovalCount)}
          />
        </section>

        <section className="overflow-hidden rounded-[18px] bg-white text-forest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-white text-xs font-bold uppercase text-forest/65">
                <tr className="border-b border-forest/10">
                  <th className="px-4 py-3">Nomor pinjaman</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Data berubah</th>
                  <th className="px-4 py-3">Sebelum</th>
                  <th className="px-4 py-3">Sesudah</th>
                  <th className="px-4 py-3">Diubah oleh</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3 text-center">Risiko</th>
                  <th className="px-4 py-3">Alasan flag</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row, index) => (
                  <tr
                    className="border-b border-forest/10 bg-white transition last:border-b-0 hover:opacity-90"
                    key={row.id ?? `${row.loan}-${row.field}-${row.changedAt}-${index}`}
                  >
                    <td className="px-4 py-4 font-bold text-forest">
                      {row.loan}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-forest">
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {row.member}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-forest/80">
                      {row.field}
                    </td>
                    <td className="px-4 py-4">{row.before}</td>
                    <td className="px-4 py-4 font-bold">{row.after}</td>
                    <td className="px-4 py-4">{row.actor}</td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        status={row.status}
                        reviewer={row.reviewer}
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <RiskBadge risk={row.risk} />
                    </td>
                    <td className="max-w-[320px] px-4 py-4 leading-5 text-forest/80">
                      {row.reason}
                    </td>
                    <td className="px-4 py-4 text-forest/70">
                      {row.changedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileSearch;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] bg-white p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime text-forest">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div>
        <p className="font-sans text-3xl font-bold leading-none tracking-normal text-forest">
          {value}
        </p>
        <p className="mt-2 text-sm font-semibold text-forest/70">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  reviewer,
}: {
  status: string;
  reviewer: string;
}) {
  const className =
    status === "approved"
      ? "bg-lime text-forest"
      : status === "pending"
        ? "bg-orange text-forest"
        : "bg-white text-forest ring-1 ring-forest/10";

  return (
    <div className="grid gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
      >
        {status === "approved" ? (
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : status === "pending" ? (
          <Clock3 className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : (
          <FileClock className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        {status}
      </span>
      <span className="text-xs text-forest/60">{reviewer}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: number }) {
  const className =
    risk >= 90
      ? "bg-orange text-forest"
      : risk >= 70
        ? "bg-lime text-forest"
        : "bg-white text-forest ring-1 ring-forest/10";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {risk >= 70 ? (
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
      ) : null}
      {risk}
    </span>
  );
}
