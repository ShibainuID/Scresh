import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function LoansPage() {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const loans = await services.loans.listByTenant(session.user.tenantId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href="/credit"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/credit" title="Daftar Pengajuan Pinjaman" />

        <Link
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-forest font-bold text-white transition hover:bg-forest/90"
          href="/credit/members"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
          Pengajuan Baru
        </Link>

        <div className="space-y-3">
          {loans.length === 0 ? (
            <div className="rounded-[24px] bg-white p-8 text-center">
              <p className="font-sans text-lg font-semibold">Belum ada pengajuan</p>
              <p className="mt-1 text-sm text-forest/70">Mulai dengan memilih anggota.</p>
            </div>
          ) : (
            loans.map((loan) => (
              <Link
                key={loan.id}
                className="block rounded-[20px] bg-white p-5 transition hover:bg-lime/30"
                href={`/credit/loans/${loan.id}/assess`}
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
