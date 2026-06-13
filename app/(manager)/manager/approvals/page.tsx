import Link from "next/link";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function ManagerApprovalsPage() {
  const session = await requireRole(["manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const loans = await services.loans.listByTenant(session.user.tenantId);
  const pendingLoans = loans.filter((l) => l.status === "pending_review");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href="/manager"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/manager" title="Approval Pinjaman" />

        {pendingLoans.length === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-forest/30" strokeWidth={2} />
            <p className="mt-4 font-sans text-lg font-semibold">Tidak ada pinjaman menunggu</p>
            <p className="mt-1 text-sm text-forest/70">Semua pengajuan sudah diputuskan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLoans.map((loan) => (
              <Link
                key={loan.id}
                className="block rounded-[20px] bg-white p-5 transition hover:bg-lime/30"
                href={`/manager/approvals/${loan.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-forest">{loan.loan_number}</span>
                  <RiskBadge
                    score={loan.risk_tier === "high" ? 85 : loan.risk_tier === "medium" ? 60 : 30}
                  />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-forest/70">{loan.purpose}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(loan.principal_amount)}
                  </span>
                  <StatusBadge status={loan.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
