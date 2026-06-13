import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AuditReviewForm } from "@/components/audit/audit-review-form";
import { VersionTimeline } from "@/components/audit/version-timeline";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

type Props = {
  params: Promise<{ loanId: string }>;
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default async function AuditDetailPage({ params }: Props) {
  const session = await requireRole(["supervisor", "admin"]);
  const { loanId } = await params;

  if (!isValidUuid(loanId)) {
    notFound();
  }

  const [loan, versions, changeRequests, reviews, anomaly] = await Promise.all([
    services.loans.getLoanDetail(loanId),
    services.loans.getLoanVersions(loanId),
    services.loans.getLoanChangeRequests(loanId),
    services.auditReviews.listByLoan(loanId),
    services.supervisorAudits.getAnomalyByLoan(loanId),
  ]);

  if (!loan) {
    notFound();
  }
  const latestReview = reviews[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader backHref="/supervisor/audit" title="Detail Audit Pinjaman" />

        <section className="rounded-[24px] bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-forest/70">{loan.tenant_name}</p>
              <h2 className="font-sans text-3xl font-semibold text-forest">{loan.loan_number}</h2>
            </div>
            {anomaly ? <RiskBadge score={anomaly.risk_score} /> : null}
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Anggota</span>
              <span className="font-medium">{loan.member_masked_name}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Nominal saat ini</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(loan.principal_amount)}
              </span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Tujuan</span>
              <span className="font-medium">{loan.purpose}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Status pinjaman</span>
              <StatusBadge status={loan.status} />
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Diajukan oleh</span>
              <span className="font-medium">{loan.requested_by_name ?? "-"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-forest/70">Disetujui oleh</span>
              <span className="font-medium">{loan.approved_by_name ?? "-"}</span>
            </div>
          </div>

          {anomaly && (
            <div className="mt-5 rounded-[16px] bg-orange/10 p-4">
              <div className="flex items-center gap-2 text-orange">
                <ShieldAlert className="h-5 w-5" strokeWidth={2.25} />
                <span className="font-semibold">Alasan flag</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-forest">{anomaly.reason}</p>
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Riwayat Perubahan</h3>
          <div className="mt-4">
            <VersionTimeline versions={versions} />
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Approval Trail</h3>
          {changeRequests.length === 0 ? (
            <p className="mt-3 text-sm text-forest/70">Tidak ada permintaan perubahan.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {changeRequests.map((cr) => (
                <div
                  key={cr.id}
                  className="rounded-[16px] border border-forest/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-forest capitalize">
                      {cr.field_name.replace(/_/g, " ")}
                    </span>
                    <StatusBadge status={cr.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-forest/70">{cr.old_value}</span>
                    <span>→</span>
                    <span className="font-medium text-forest">{cr.new_value}</span>
                  </div>
                  <p className="mt-2 text-sm text-forest/70">{cr.reason}</p>
                  <div className="mt-2 text-xs text-forest/50">
                    Request: {cr.requested_by_name ?? "-"} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(cr.created_at))}
                  </div>
                  {cr.reviewed_by_name && cr.reviewed_at && (
                    <div className="mt-1 text-xs text-forest/50">
                      Review: {cr.reviewed_by_name} ·{" "}
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(cr.reviewed_at))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Catatan Pemeriksaan</h3>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-forest/70">Belum ada catatan.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[16px] border border-forest/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-forest">{review.reviewer_name}</span>
                    <StatusBadge status={review.status} />
                  </div>
                  <p className="mt-1 text-sm text-forest/70">{review.note ?? "Tidak ada catatan."}</p>
                  <p className="mt-1 text-xs text-forest/50">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(review.created_at))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Validasi Auditor</h3>
          <AuditReviewForm loanId={loanId} />
        </section>
      </div>
    </main>
  );
}
