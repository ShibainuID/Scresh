import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/server/services/container";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const cooperatives = await services.tenants.searchByName(query);

  return NextResponse.json({ cooperatives });
}
