import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import type { AuditFilters } from "@/lib/server/repositories/supervisor-audit-repository";

function escapeCsv(value: string | number): string {
  const str = String(value).replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  await requireRole(["supervisor", "admin"]);

  const searchParams = request.nextUrl.searchParams;
  const filters: AuditFilters = {};

  const search = searchParams.get("search");
  if (search) filters.search = search;

  const tenantId = searchParams.get("tenantId");
  if (tenantId) filters.tenantId = tenantId;

  const status = searchParams.get("status");
  if (status) filters.status = status;

  const riskMin = searchParams.get("riskMin");
  if (riskMin) filters.riskMin = Number(riskMin);

  const riskMax = searchParams.get("riskMax");
  if (riskMax) filters.riskMax = Number(riskMax);

  const dateFrom = searchParams.get("dateFrom");
  if (dateFrom) filters.dateFrom = new Date(dateFrom);

  const dateTo = searchParams.get("dateTo");
  if (dateTo) filters.dateTo = new Date(dateTo);

  const minAmount = searchParams.get("minAmount");
  if (minAmount) filters.minAmount = Number(minAmount);

  const maxAmount = searchParams.get("maxAmount");
  if (maxAmount) filters.maxAmount = Number(maxAmount);

  const rows = await services.supervisorAudits.list(filters, 1000);

  const headers = [
    "Nomor Pinjaman",
    "Koperasi",
    "Anggota",
    "Field",
    "Sebelum",
    "Sesudah",
    "Aktor",
    "Reviewer",
    "Status",
    "Risk Score",
    "Alasan",
    "Waktu Perubahan",
  ];

  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      [
        row.loan,
        row.tenantName,
        row.member,
        row.field,
        row.before,
        row.after,
        row.actor,
        row.reviewer,
        row.status,
        row.risk,
        row.reason,
        row.changedAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];

  const csv = lines.join("\n");
  const filename = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
