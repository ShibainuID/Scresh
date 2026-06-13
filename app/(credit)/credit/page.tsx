import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function CreditPage() {
  const session = await requireRole(["credit", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const [members, loanRows] = await Promise.all([
    services.members.listByTenant(session.user.tenantId),
    services.loans.listByTenant(session.user.tenantId),
  ]);

  const pendingReview = loanRows.filter((l) => l.status === "pending_review").length;
  const lowRisk = loanRows.filter((l) => l.risk_tier === "low").length;
  const mediumRisk = loanRows.filter((l) => l.risk_tier === "medium").length;
  const highRisk = loanRows.filter((l) => l.risk_tier === "high").length;

  return (
    <RoleDashboard
      activeModule="Credit Risk"
      cooperativeName="Koperasi Melati Jaya"
      location="Bandung, Indonesia"
      role="credit"
      roleTitle="Petugas Kredit"
      session={session}
      widgets={[
        {
          title: "Antrean Assessment",
          metrics: [
            { label: "Pengajuan aktif", value: String(loanRows.length) },
            { label: "Menunggu review", value: String(pendingReview) },
            { label: "Low risk", value: String(lowRisk) },
            { label: "High risk", value: String(highRisk) },
          ],
        },
        {
          title: "Profil Anggota",
          span: "full",
          metrics: [
            { label: "Total anggota", value: String(members.length) },
            { label: "Identitas terverifikasi", value: String(members.filter((m) => m.national_id).length) },
            { label: "Low risk", value: String(lowRisk) },
            { label: "Medium risk", value: String(mediumRisk) },
          ],
        },
        {
          title: "Ajukan Pinjaman Baru",
          description: "Catat kebutuhan dan tujuan pembiayaan anggota.",
          span: "full",
          cta: { label: "Mulai", href: "/credit/members" },
        },
        {
          title: "Lihat Daftar Pengajuan",
          description: "Assessment queue dan status risk tier.",
          span: "full",
          cta: { label: "Buka", href: "/credit/loans" },
        },
        {
          title: "Cari Anggota",
          description: "Cek identitas, status, dan riwayat pinjaman.",
          span: "full",
          cta: { label: "Cari", href: "/credit/members" },
        },
      ]}
    />
  );
}
