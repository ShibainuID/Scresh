"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import type { TenantSummary } from "@/lib/server/repositories/tenant-repository";

export function AuditFilterBar({ tenants }: { tenants: TenantSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      return params.toString();
    },
    [searchParams],
  );

  function update(key: string, value: string) {
    const query = createQueryString({ [key]: value });
    router.push(`${pathname}?${query}`, { scroll: false });
  }

  function clearFilters() {
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="rounded-[24px] bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/50" />
          <input
            className="h-11 w-full rounded-[12px] border border-forest/15 bg-transparent pl-9 pr-3 text-sm font-medium text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Cari nomor pinjaman atau koperasi"
            type="search"
          />
        </div>
        <button
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-forest/15 text-forest transition hover:bg-lime"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 border-t border-forest/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-xs font-semibold text-forest">
            Koperasi
            <select
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition focus:border-forest"
              onChange={(e) => update("tenantId", e.target.value)}
              value={searchParams.get("tenantId") ?? ""}
            >
              <option value="">Semua koperasi</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Status
            <select
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition focus:border-forest"
              onChange={(e) => update("status", e.target.value)}
              value={searchParams.get("status") ?? ""}
            >
              <option value="">Semua status</option>
              <option value="approved">Disetujui</option>
              <option value="pending">Menunggu</option>
              <option value="logged">Tercatat</option>
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Risk min
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
              defaultValue={searchParams.get("riskMin") ?? ""}
              min={0}
              max={100}
              onChange={(e) => update("riskMin", e.target.value)}
              placeholder="0"
              type="number"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Risk max
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
              defaultValue={searchParams.get("riskMax") ?? ""}
              min={0}
              max={100}
              onChange={(e) => update("riskMax", e.target.value)}
              placeholder="100"
              type="number"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Dari tanggal
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition focus:border-forest"
              defaultValue={searchParams.get("dateFrom") ?? ""}
              onChange={(e) => update("dateFrom", e.target.value)}
              type="date"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Sampai tanggal
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition focus:border-forest"
              defaultValue={searchParams.get("dateTo") ?? ""}
              onChange={(e) => update("dateTo", e.target.value)}
              type="date"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Nominal min (Rp)
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
              defaultValue={searchParams.get("minAmount") ?? ""}
              onChange={(e) => update("minAmount", e.target.value)}
              placeholder="0"
              type="number"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-forest">
            Nominal max (Rp)
            <input
              className="h-11 rounded-[12px] border border-forest/15 bg-transparent px-3 text-sm text-forest outline-none transition placeholder:text-forest/50 focus:border-forest"
              defaultValue={searchParams.get("maxAmount") ?? ""}
              onChange={(e) => update("maxAmount", e.target.value)}
              placeholder="50000000"
              type="number"
            />
          </label>
        </div>
      )}

      {(searchParams.toString() || expanded) && (
        <button
          className="mt-3 text-xs font-semibold text-forest/70 underline underline-offset-4 hover:text-forest"
          onClick={clearFilters}
          type="button"
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
