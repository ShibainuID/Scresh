import Link from "next/link";
import { ChevronLeft, Search, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const { search } = await searchParams;
  const members = await services.members.listByTenant(session.user.tenantId, search);

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

        <PageHeader backHref="/credit" title="Cari Anggota" />

        <form className="rounded-[24px] bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-forest/50" />
            <input
              className="h-12 w-full rounded-[12px] border border-forest/15 bg-transparent pl-10 pr-4 text-base font-medium text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
              defaultValue={search ?? ""}
              name="search"
              placeholder="Cari nama, NIK, atau telepon"
              type="search"
            />
          </div>
        </form>

        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="rounded-[24px] bg-white p-8 text-center">
              <p className="font-sans text-lg font-semibold">Tidak ada anggota</p>
              <p className="mt-1 text-sm text-forest/70">Coba kata kunci lain.</p>
            </div>
          ) : (
            members.map((member) => (
              <Link
                key={member.id}
                className="flex items-center gap-4 rounded-[20px] bg-white p-4 transition hover:bg-lime/30"
                href={`/credit/members/${member.id}`}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime text-forest">
                  <User className="h-6 w-6" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-forest">{member.full_name}</p>
                  <p className="text-sm text-forest/70">
                    {member.national_id ?? "-"} · {member.phone ?? "-"}
                  </p>
                </div>
                <span className="rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold text-forest">
                  {member.membership_status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
