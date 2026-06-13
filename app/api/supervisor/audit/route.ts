import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export async function GET() {
  await requireRole(["supervisor", "admin"]);
  const rows = await services.supervisorAudits.list(80);

  return NextResponse.json({ rows });
}
