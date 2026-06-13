import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, ShieldCheck, User } from "lucide-react";
import { ConsentForm } from "@/components/credit/consent-form";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: Props) {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const { id } = await params;
  const [member, loanHistory] = await Promise.all([
    services.members.findById(id),
    services.members.getLoanHistory(id, session.user.tenantId),
  ]);

  if (!member) {
    notFound();
  }

  // For demo, find cross-cooperative records by national_id
  const crossMembers = member.national_id
    ? await services.members.findByNationalIdAcrossTenants(member.national_id)
    : [];
  const otherCoopMembers = crossMembers.filter((m) => m.tenant_id !== session.user.tenantId);

  const crossSummaries = await Promise.all(
    otherCoopMembers.map(async (m) => {
      const consent = await services.memberConsents.getConsent(id, m.tenant_id, "credit_summary");
      const summary = await services.creditSummaries.getSummary(m.id, m.tenant_id);
      return { member: m, consent, summary };
    }),
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href="/credit/members"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/credit/members" title="Profil Anggota" />

        <section className="rounded-[24px] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-lime text-forest">
              <User className="h-8 w-8" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-sans text-2xl font-semibold text-forest">{member.full_name}</h2>
              <p className="text-sm text-forest/70">{member.commodity_focus ?? "Anggota koperasi"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">NIK</span>
              <span className="font-medium">{member.national_id ?? "-"}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Telepon</span>
              <span className="font-medium">{member.phone ?? "-"}</span>
            </div>
            <div className="flex justify-between border-b border-forest/10 py-2">
              <span className="text-forest/70">Status keanggotaan</span>
              <StatusBadge status={member.membership_status} />
            </div>
            <div className="flex justify-between py-2">
              <span className="text-forest/70">Terdaftar sejak</span>
              <span className="font-medium">
                {new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(new Date(member.created_at))}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <h3 className="font-sans text-xl font-semibold text-forest">Riwayat Pinjaman</h3>
          {loanHistory.length === 0 ? (
            <p className="mt-3 text-sm text-forest/70">Belum ada riwayat pinjaman di koperasi ini.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {loanHistory.map((loan) => (
                <div key={loan.id} className="rounded-[16px] border border-forest/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest">{loan.loan_number}</span>
                    <RiskBadge score={loan.risk_tier === "high" ? 85 : loan.risk_tier === "medium" ? 60 : 30} />
                  </div>
                  <p className="mt-1 text-sm text-forest/70">{loan.purpose}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(loan.principal_amount)}
                    </span>
                    <StatusBadge status={loan.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-forest" strokeWidth={2.25} />
            <h3 className="font-sans text-xl font-semibold text-forest">Data Lintas Koperasi</h3>
          </div>
          <p className="mt-2 text-sm text-forest/70">
            Hanya ringkasan yang ditampilkan setelah consent diberikan. Tidak ada data raw.
          </p>

          {crossSummaries.length === 0 ? (
            <p className="mt-3 text-sm text-forest/70">Tidak ditemukan keanggotaan di koperasi lain.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {crossSummaries.map(({ member: crossMember, consent, summary }) => (
                <div key={crossMember.id} className="rounded-[16px] border border-forest/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest">{crossMember.tenant_name}</span>
                    {consent?.granted ? (
                      <span className="rounded-full bg-lime px-2 py-1 text-xs font-bold text-forest">Consent aktif</span>
                    ) : (
                      <span className="rounded-full bg-forest/10 px-2 py-1 text-xs font-bold text-forest">Belum consent</span>
                    )}
                  </div>

                  {consent?.granted && summary ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-[12px] bg-forest/5 p-3">
                        <p className="text-xs text-forest/60">Tunggakan aktif</p>
                        <p className="font-semibold">{summary.active_arrears_count > 0 ? "Ada" : "Tidak ada"}</p>
                      </div>
                      <div className="rounded-[12px] bg-forest/5 p-3">
                        <p className="text-xs text-forest/60">Pinjaman aktif</p>
                        <p className="font-semibold">{summary.running_loan_count}</p>
                      </div>
                      <div className="rounded-[12px] bg-forest/5 p-3">
                        <p className="text-xs text-forest/60">On-time ratio</p>
                        <p className="font-semibold">{summary.on_time_ratio}%</p>
                      </div>
                      <div className="rounded-[12px] bg-forest/5 p-3">
                        <p className="text-xs text-forest/60">Risk tier</p>
                        <p className="font-semibold uppercase">{summary.risk_tier}</p>
                      </div>
                    </div>
                  ) : (
                    <ConsentForm memberId={id} tenantId={crossMember.tenant_id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          className="flex h-14 items-center justify-center gap-2 rounded-[14px] bg-forest font-bold text-white transition hover:bg-forest/90"
          href={`/credit/loans/new?memberId=${member.id}`}
        >
          <FileText className="h-5 w-5" strokeWidth={2.25} />
          Ajukan Pinjaman Baru
        </Link>
      </div>
    </main>
  );
}
