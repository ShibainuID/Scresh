import type { ReactNode } from "react";
import Link from "next/link";
import {
  Plus,
  PackageCheck,
  Trash2,
  RotateCcw,
  FileWarning,
} from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { PageHeader } from "@/components/page-header";

const movementIcons: Record<string, ReactNode> = {
  distribution: <PackageCheck className="h-5 w-5" />,
  waste: <Trash2 className="h-5 w-5" />,
  return: <RotateCcw className="h-5 w-5" />,
  claim: <FileWarning className="h-5 w-5" />,
};

const movementLabels: Record<string, string> = {
  distribution: "Distribusi",
  waste: "Waste",
  return: "Return",
  claim: "Klaim supplier",
};

export default async function MovementsPage() {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const [movements, summary] = await Promise.all([
    services.scresh.listMovements(session.user.tenantId),
    services.scresh.getMovementSummary(session.user.tenantId),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 md:px-8">
        <PageHeader
          backHref="/staff"
          rightAction={
            <Link
              className="grid h-12 w-12 place-items-center rounded-full bg-forest text-white transition hover:bg-forest/90"
              href="/staff/movements/new"
            >
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </Link>
          }
          title=""
        />

        <section className="rounded-[28px] bg-white p-5 text-forest">
          <p className="font-sans text-2xl font-semibold leading-8">
            Ringkasan Pergerakan Stok
          </p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryCard
              label="Distribusi"
              value={`${summary.total_outbound_kg} kg`}
            />
            <SummaryCard label="Waste" value={`${summary.total_waste_kg} kg`} />
            <SummaryCard
              label="Return"
              value={`${summary.total_return_kg} kg`}
            />
            <SummaryCard
              label="Klaim supplier"
              value={`${summary.total_claim_kg} kg`}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[18px] bg-white text-forest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white text-xs font-bold uppercase text-forest/65">
                <tr className="border-b border-forest/10">
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Tujuan</th>
                  <th className="px-4 py-3">Jumlah</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr
                    className="border-b border-forest/10 bg-white transition last:border-b-0 hover:opacity-90"
                    key={movement.id}
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-forest">
                          {movementIcons[movement.movement_type] ?? (
                            <PackageCheck className="h-3.5 w-3.5" />
                          )}
                        </span>
                        {movementLabels[movement.movement_type] ?? movement.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">{movement.destination}</td>
                    <td className="px-4 py-4 font-bold">{movement.quantity_kg} kg</td>
                    <td className="max-w-[240px] px-4 py-4 text-forest/80">
                      {movement.notes ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-forest/70">
                      {new Date(movement.created_at).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-forest/70" colSpan={5}>
                      Belum ada pergerakan stok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4">
      <p className="font-sans text-3xl font-bold leading-9 tracking-normal text-forest">
        {value}
      </p>
      <p className="mt-1 text-sm leading-5 text-forest/70">{label}</p>
    </div>
  );
}
