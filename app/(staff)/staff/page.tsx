import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

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
