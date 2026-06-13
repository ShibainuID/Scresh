import Link from "next/link";
import { AlertTriangle, ChevronLeft, Clock3, Download, FileSearch } from "lucide-react";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import type { AuditFilters } from "@/lib/server/repositories/supervisor-audit-repository";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SupervisorAuditPage({ searchParams }: Props) {
  const session = await requireRole(["supervisor", "admin"]);
  const params = await searchParams;

  const filters: AuditFilters = {};
  if (params.search) filters.search = params.search;
  if (params.tenantId) filters.tenantId = params.tenantId;
  if (params.status) filters.status = params.status;
  if (params.riskMin) filters.riskMin = Number(params.riskMin);
  if (params.riskMax) filters.riskMax = Number(params.riskMax);
  if (params.dateFrom) filters.dateFrom = new Date(params.dateFrom);
  if (params.dateTo) filters.dateTo = new Date(params.dateTo);
  if (params.minAmount) filters.minAmount = Number(params.minAmount);
  if (params.maxAmount) filters.maxAmount = Number(params.maxAmount);

  const [auditRows, counts, tenants] = await Promise.all([
    services.supervisorAudits.list(filters, 200),
    services.supervisorAudits.getCounts(),
    services.tenants.listAll(),
  ]);

  const highRiskCount = auditRows.filter((row) => row.risk >= 70).length;
  const pendingApprovalCount = auditRows.filter((row) => row.status === "pending").length;

  const exportQuery = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) exportQuery.set(key, value);
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-forest transition hover:opacity-90"
          href="/supervisor"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Kembali
        </Link>

        <PageHeader backHref="/supervisor" title="Audit Perubahan Pinjaman" />

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={FileSearch}
            label="Perubahan masuk audit"
            value={String(auditRows.length)}
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Anomali tinggi"
            value={String(highRiskCount)}
          />
          <SummaryCard
            icon={Clock3}
            label="Menunggu approval"
            value={String(pendingApprovalCount)}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xl font-semibold text-forest">Daftar Perubahan</h2>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-forest px-4 text-sm font-bold text-white transition hover:bg-forest/90"
              href={`/api/supervisor/audit/export?${exportQuery.toString()}`}
            >
              <Download className="h-4 w-4" strokeWidth={2.25} />
              Export CSV
            </a>
          </div>

          <AuditFilterBar tenants={tenants} />
          <AuditTable rows={auditRows} />
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
