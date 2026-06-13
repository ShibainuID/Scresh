import Link from "next/link";
import { Plus, AlertTriangle, ThermometerSnowflake } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { PageHeader } from "@/components/page-header";

export default async function BatchListPage() {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const batches = await services.scresh.listBatches(session.user.tenantId);

  const priorityBatches = [...batches].sort((a, b) => {
    const gradeOrder: Record<string, number> = { D: 1, C: 2, B: 3, A: 4, pending: 99 };
    const gradeDiff = (gradeOrder[a.freshness_grade] ?? 99) - (gradeOrder[b.freshness_grade] ?? 99);
    if (gradeDiff !== 0) return gradeDiff;
    return a.shelf_life_hours - b.shelf_life_hours;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-7 md:px-8">
        <PageHeader
          backHref="/staff"
          rightAction={
            <Link
              className="grid h-12 w-12 place-items-center rounded-full bg-forest text-white transition hover:bg-forest/90"
              href="/staff/batches/new"
            >
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </Link>
          }
          title="Daftar Batch"
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Prioritas distribusi"
            value={String(priorityBatches.filter((b) => ["C", "D"].includes(b.freshness_grade) || b.shelf_life_hours <= 24).length)}
          />
          <SummaryCard
            label="Total batch aktif"
            value={String(batches.length)}
          />
          <SummaryCard
            label="Total sisa stok"
            value={`${batches.reduce((sum, b) => sum + Number(b.remaining_weight_kg), 0).toFixed(1)} kg`}
          />
        </section>

        <section className="overflow-hidden rounded-[18px] bg-white text-forest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-white text-xs font-bold uppercase text-forest/65">
                <tr className="border-b border-forest/10">
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Komoditas</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Berat klaim</th>
                  <th className="px-4 py-3">Berat aktual</th>
                  <th className="px-4 py-3">Selisih</th>
                  <th className="px-4 py-3">Sisa stok</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Shelf life</th>
                  <th className="px-4 py-3">Cold storage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const weightDelta = Number(
                    (batch.actual_weight_kg - batch.claimed_weight_kg).toFixed(2),
                  );
                  const isRisk =
                    batch.freshness_grade === "D" ||
                    batch.freshness_grade === "C" ||
                    batch.shelf_life_hours <= 24;

                  return (
                    <tr
                      className="border-b border-forest/10 bg-white transition last:border-b-0 hover:opacity-90"
                      key={batch.id}
                    >
                      <td className="px-4 py-4 font-bold">{batch.batch_code}</td>
                      <td className="px-4 py-4">{batch.commodity}</td>
                      <td className="px-4 py-4">{batch.supplier_name}</td>
                      <td className="px-4 py-4">{batch.claimed_weight_kg} kg</td>
                      <td className="px-4 py-4">{batch.actual_weight_kg} kg</td>
                      <td className="px-4 py-4">
                        <span className={weightDelta < 0 ? "font-bold text-orange" : ""}>
                          {weightDelta > 0 ? "+" : ""}
                          {weightDelta} kg
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold">{batch.remaining_weight_kg} kg</td>
                      <td className="px-4 py-4">
                        <GradeBadge grade={batch.freshness_grade} />
                      </td>
                      <td className="px-4 py-4">{batch.shelf_life_hours} jam</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1">
                          <ThermometerSnowflake className="h-3.5 w-3.5" />
                          {batch.storage_location ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-white">
                            <AlertTriangle className="h-3 w-3" />
                            Prioritas
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-forest">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Link
                            className="rounded-[8px] bg-forest px-3 py-1.5 text-xs font-bold text-white transition hover:bg-forest/90"
                            href={`/staff/batches/${batch.id}/scan`}
                          >
                            Scan
                          </Link>
                          <Link
                            className="rounded-[8px] bg-white px-3 py-1.5 text-xs font-bold text-forest ring-1 ring-forest/10 transition hover:bg-forest/5"
                            href={`/staff/batches/${batch.id}/tag`}
                          >
                            Tag
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
    <div className="flex items-center gap-4 rounded-[18px] bg-white p-5">
      <div>
        <p className="font-sans text-3xl font-bold leading-none tracking-normal text-forest">
          {value}
        </p>
        <p className="mt-2 text-sm font-semibold text-forest/70">{label}</p>
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-lime text-forest",
    B: "bg-yellow-300 text-forest",
    C: "bg-orange text-white",
    D: "bg-red-600 text-white",
    pending: "bg-white text-forest ring-1 ring-forest/10",
  };

  return (
    <span
      className={`inline-flex h-7 min-w-[3rem] items-center justify-center rounded-full px-2 text-xs font-bold ${colors[grade] ?? colors.pending}`}
    >
      {grade.toUpperCase()}
    </span>
  );
}
