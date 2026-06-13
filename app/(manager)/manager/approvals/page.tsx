import Link from "next/link";
import { CheckCircle2, ChevronLeft, Clock3, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { approveLoanAction, rejectLoanAction } from "./actions";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ManagerApprovalsPage() {
  const session = await requireRole(["manager", "admin"]);
  const tenantId = session.user.tenantId;

  if (!tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const applications = await services.loanService.listPendingApplications(
    tenantId,
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
              href="/manager"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              Kembali
            </Link>
            <div className="flex items-center gap-3">
              <div>
                <h1>Persetujuan Pengajuan Kredit</h1>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={Clock3}
            label="Menunggu persetujuan"
            value={String(applications.length)}
          />
        </section>

        <section className="overflow-hidden rounded-[18px] bg-white text-forest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-white text-xs font-bold uppercase text-forest/65">
                <tr className="border-b border-forest/10">
                  <th className="px-4 py-3">Nomor pinjaman</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Petugas kredit</th>
                  <th className="px-4 py-3">Jumlah pinjaman</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Tujuan</th>
                  <th className="px-4 py-3">Waktu pengajuan</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-forest/70"
                      colSpan={8}
                    >
                      Tidak ada pengajuan kredit yang menunggu persetujuan.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr
                      className="border-b border-forest/10 bg-white transition last:border-b-0 hover:opacity-90"
                      key={application.id}
                    >
                      <td className="px-4 py-4 font-bold text-forest">
                        {application.loanNumber}
                      </td>
                      <td className="px-4 py-4">{application.memberName}</td>
                      <td className="px-4 py-4">
                        {application.creditOfficerName}
                      </td>
                      <td className="px-4 py-4 font-bold">
                        {currencyFormatter.format(application.principalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <RiskBadge riskTier={application.riskTier} />
                      </td>
                      <td className="max-w-[260px] px-4 py-4 leading-5 text-forest/80">
                        {application.purpose}
                      </td>
                      <td className="px-4 py-4 text-forest/70">
                        {dateFormatter.format(application.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <form action={approveLoanAction}>
                            <input
                              name="loanId"
                              type="hidden"
                              value={application.id}
                            />
                            <button
                              className="inline-flex h-8 items-center gap-1 rounded-full bg-lime px-3 text-xs font-bold text-forest transition hover:bg-lime/80"
                              type="submit"
                            >
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                strokeWidth={2.25}
                              />
                              Setuju
                            </button>
                          </form>
                          <form action={rejectLoanAction}>
                            <input
                              name="loanId"
                              type="hidden"
                              value={application.id}
                            />
                            <button
                              className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-bold text-forest ring-1 ring-forest/15 transition hover:bg-forest/5"
                              type="submit"
                            >
                              <XCircle
                                className="h-3.5 w-3.5"
                                strokeWidth={2.25}
                              />
                              Tolak
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
  icon: typeof Clock3;
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

function RiskBadge({ riskTier }: { riskTier: string }) {
  const className =
    riskTier === "high"
      ? "bg-orange text-forest"
      : riskTier === "medium"
        ? "bg-lime text-forest"
        : "bg-white text-forest ring-1 ring-forest/10";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${className}`}
    >
      {riskTier}
    </span>
  );
}
