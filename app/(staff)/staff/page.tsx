import Link from "next/link";
import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import type { ScreshBatchRow } from "@/lib/server/repositories/scresh-batch-repository";

export default async function StaffPage() {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const [batches, movements] = await Promise.all([
    services.scresh.listBatches(session.user.tenantId),
    services.scresh.listMovements(session.user.tenantId),
  ]);

  const pendingScan = batches.filter((b) => b.freshness_grade === "pending").length;
  const urgentBatches = batches.filter(
    (b) => b.freshness_grade === "D" || b.freshness_grade === "C" || b.shelf_life_hours <= 24,
  ).length;
  const totalRemainingKg = batches.reduce((sum, b) => sum + Number(b.remaining_weight_kg), 0);
  const recommendation = buildDistributionRecommendation(batches);
  const todayMovements = movements.filter((m) => {
    const created = new Date(m.created_at);
    const today = new Date();
    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  });

  return (
    <RoleDashboard
      activeModule="Scresh"
      cooperativeName="Koperasi Melati Jaya"
      location="Bandung, Indonesia"
      role="staff"
      roleTitle="Staf Koperasi"
      session={session}
      widgets={[
        {
          title: "Batch tracking hari ini",
          metrics: [
            { label: "Batch aktif", value: String(batches.length) },
            { label: "Menunggu scan", value: String(pendingScan) },
            { label: "Butuh prioritas", value: String(urgentBatches) },
            { label: "Total sisa stok", value: `${totalRemainingKg.toFixed(1)} kg` },
          ],
        },
        {
          title: "AI freshness scan",
          metrics: [
            { label: "Grade A/B", value: String(batches.filter((b) => ["A", "B"].includes(b.freshness_grade)).length) },
            { label: "Grade C urgent", value: String(batches.filter((b) => b.freshness_grade === "C").length) },
            { label: "Grade D tahan", value: String(batches.filter((b) => b.freshness_grade === "D").length) },
            { label: "Rata-rata confidence", value: `${averageConfidence(batches)}%` },
          ],
        },
        {
          title: "Terima batch",
          description: "Buat Batch ID dari supplier",
          cta: { label: "Mulai", href: "/staff/batches/new" },
        },
        {
          title: "Daftar batch",
          description: "Lihat grade, shelf life, dan prioritas",
          cta: { label: "Lihat", href: "/staff/batches" },
        },
        {
          title: "Scan distribusi",
          description: "Catat outbound movement",
          cta: { label: "Scan", href: "/staff/movements/new" },
        },
        {
          title: "Laporan stok",
          description: "Distribusi, waste, return, klaim",
          cta: { label: "Buka", href: "/staff/movements" },
        },
        {
          title: "Cold-storage & reservasi",
          span: "full",
          metrics: [
            { label: "Batch tersimpan", value: String(batches.filter((b) => b.storage_location).length) },
            { label: "Stok tersedia", value: `${totalRemainingKg.toFixed(1)} kg` },
            { label: "Grade C/D", value: String(urgentBatches) },
            { label: "Butuh distribusi", value: String(batches.filter((b) => b.status === "priority_distribution").length) },
          ],
        },
        {
          title: "Distribusi keluar",
          span: "full",
          metrics: [
            { label: "Outbound hari ini", value: String(todayMovements.length) },
            { label: "Quantity keluar", value: `${todayMovements.reduce((sum, m) => sum + Number(m.quantity_kg), 0).toFixed(1)} kg` },
            { label: "Total pergerakan", value: String(movements.length) },
            { label: "FIFO priority", value: String(batches.filter((b) => b.distribution_priority <= 2).length) },
          ],
        },
        {
          title: "Rekomendasi urutan distribusi",
          description: "Berdasarkan FIFO dan freshness grade (prioritas rendah = keluar dulu)",
          span: "full",
          cta: { label: "Buat movement", href: "/staff/movements/new" },
          content: <DistributionRecommendationList batches={recommendation} />,
        },
      ]}
    />
  );
}

function averageConfidence(batches: { confidence_score: number; freshness_grade: string }[]) {
  const scanned = batches.filter((b) => b.freshness_grade !== "pending");
  if (scanned.length === 0) return "0";
  const avg = scanned.reduce((sum, b) => sum + Number(b.confidence_score), 0) / scanned.length;
  return avg.toFixed(0);
}

function buildDistributionRecommendation(batches: ScreshBatchRow[]): ScreshBatchRow[] {
  return [...batches]
    .filter((b) => Number(b.remaining_weight_kg) > 0 && b.freshness_grade !== "pending")
    .sort((a, b) => {
      if (a.distribution_priority !== b.distribution_priority) {
        return a.distribution_priority - b.distribution_priority;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, 5);
}

function DistributionRecommendationList({ batches }: { batches: ScreshBatchRow[] }) {
  if (batches.length === 0) {
    return (
      <p className="text-sm leading-5 text-forest/65">
        Tidak ada batch yang siap didistribusikan. Tambah atau scan batch terlebih dahulu.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {batches.map((batch, index) => (
        <li key={batch.id}>
          <Link
            className="flex items-center gap-4 rounded-[18px] bg-white p-4 text-forest transition hover:bg-white/80"
            href={`/staff/movements/new?batchId=${batch.id}`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime font-sans text-sm font-bold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-lg font-semibold leading-6 tracking-normal">
                {batch.batch_code}
              </p>
              <p className="truncate text-sm leading-5 text-forest/70">
                {batch.commodity} · {batch.supplier_name} · {Number(batch.remaining_weight_kg).toFixed(1)} kg tersisa
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-bold uppercase tracking-normal text-white">
                Grade {batch.freshness_grade.toUpperCase()}
              </span>
              <span className="text-xs leading-4 text-forest/70">
                {batch.shelf_life_hours} jam
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
