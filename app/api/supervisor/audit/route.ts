import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import type { AuditFilters } from "@/lib/server/repositories/supervisor-audit-repository";

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

  const rows = await services.supervisorAudits.list(filters, 200);

  return NextResponse.json({ rows });
}
