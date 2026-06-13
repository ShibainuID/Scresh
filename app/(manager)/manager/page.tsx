import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function ManagerPage() {
  const session = await requireRole(["manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const [loans, batches] = await Promise.all([
    services.loans.listByTenant(session.user.tenantId),
    services.screshBatches.listByTenant(session.user.tenantId),
  ]);

  const pendingLoans = loans.filter((l) => l.status === "pending_review").length;
  const approvedToday = loans.filter(
    (l) => l.status === "approved" && new Date(l.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const highRisk = loans.filter((l) => l.risk_tier === "high").length;
  const correctionBatches = batches.filter((b) => b.status === "pending_correction").length;

  return (
    <RoleDashboard
      activeModule="Management"
      cooperativeName="Koperasi Melati Jaya"
      location="Bandung, Indonesia"
      role="manager"
      roleTitle="Manager Koperasi"
      session={session}
      widgets={[
        {
          title: "Antrean Approval",
          metrics: [
            { label: "Pinjaman menunggu", value: String(pendingLoans) },
            { label: "High risk", value: String(highRisk), status: "review" },
            { label: "Disetujui hari ini", value: String(approvedToday) },
            { label: "Koreksi stok", value: String(correctionBatches) },
          ],
        },
        {
          title: "Aksi Cepat",
          span: "full",
          actions: [
            {
              label: "Approve Pinjaman",
              description: "Lihat dan putuskan pengajuan dari petugas kredit.",
              href: "/manager/approvals",
            },
            {
              label: "Lihat Audit Anomali",
              description: "Perubahan mencurigakan yang perlu ditinjau.",
              href: "/supervisor/audit",
            },
          ],
        },
      ]}
    />
  );
}
