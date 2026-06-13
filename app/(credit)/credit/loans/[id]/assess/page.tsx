import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RecommendationForm } from "@/components/credit/recommendation-form";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LoanAssessPage({ params }: Props) {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const { id } = await params;
  const [loan, versions] = await Promise.all([
    services.loans.getLoanDetail(id),
    services.loans.getLoanVersions(id),
  ]);

  if (!loan) {
    notFound();
  }

  const assessment = await services.creditAssessment.assess(
    loan.member_id,
    session.user.tenantId,
    loan.principal_amount,
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href="/credit/loans"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/credit/loans" title="Assessment Risiko" />

        <section className="rounded-[24px] bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-forest/70">{loan.loan_number}</p>
              <h2 className="font-sans text-3xl font-semibold text-forest">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(loan.principal_amount)}
              </h2>
            </div>
            <RiskBadge
              score={assessment.riskTier === "high" ? 85 : assessment.riskTier === "medium" ? 60 : 30}
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Anggota</span>
              <span className="font-medium">{loan.member_masked_name}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Tujuan</span>
              <span className="font-medium">{loan.purpose}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Status</span>
              <StatusBadge status={loan.status} />
            </div>
            <div className="flex justify-between py-2">
              <span className="text-forest/70">Risk tier</span>
              <span className="font-semibold uppercase">{assessment.riskTier}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Hasil Assessment</h3>
          <div className="mt-3 rounded-[16px] bg-lime/30 p-4">
            <p className="text-sm text-forest/70">Risk score</p>
            <p className="font-sans text-4xl font-bold text-forest">{assessment.score}</p>
          </div>
          <ul className="mt-4 grid gap-2">
            {assessment.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-forest">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                {reason}
              </li>
            ))}
          </ul>

          {assessment.crossCooperativeAvailable ? (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-forest">Credit Summary Lintas Koperasi</h4>
              <div className="mt-2 space-y-2">
                {assessment.crossCooperativeSummaries.map((summary, index) => (
                  <div
                    key={index}
                    className="rounded-[12px] border border-forest/10 p-3 text-sm"
                  >
                    <p className="font-semibold">{summary.tenantName}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-forest/70">
                      <span>Tunggakan: {summary.activeArrearsCount > 0 ? "Ada" : "Tidak"}</span>
                      <span>Pinjaman aktif: {summary.runningLoanCount}</span>
                      <span>On-time: {summary.onTimeRatio}%</span>
                      <span>Risk: {summary.riskTier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-forest/70">
              Tidak ada data lintas koperasi yang tersedia. Minta consent di profil anggota.
            </p>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Riwayat Versi</h3>
          {versions.length === 0 ? (
            <p className="mt-3 text-sm text-forest/70">Belum ada riwayat.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex justify-between rounded-[12px] bg-forest/5 p-3 text-sm">
                  <span>Versi {v.version_number}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(v.principal_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Rekomendasi</h3>
          <RecommendationForm loanId={id} />
        </section>
      </div>
    </main>
  );
}
