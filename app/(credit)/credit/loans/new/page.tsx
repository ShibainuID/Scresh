import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LoanApplicationForm } from "@/components/credit/loan-application-form";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

type Props = {
  searchParams: Promise<{ memberId?: string }>;
};

export default async function NewLoanPage({ searchParams }: Props) {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const { memberId } = await searchParams;
  const members = await services.members.listByTenant(session.user.tenantId);
  const selectedMember = memberId ? members.find((m) => m.id === memberId) : undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href={memberId ? `/credit/members/${memberId}` : "/credit/members"}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/credit/members" title="Pengajuan Pinjaman" />

        <LoanApplicationForm
          members={members.map((m) => ({ id: m.id, full_name: m.full_name, national_id: m.national_id }))}
          selectedMemberId={selectedMember?.id}
        />
      </div>
    </main>
  );
}
