import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function ManagerPage() {
  const session = await requireRole(["manager", "admin"]);
  const pendingCreditCount = session.user.tenantId
    ? await services.loanService.countPendingApplications(session.user.tenantId)
    : 0;

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
          title: "Operasi Scresh",
          metrics: [
            { label: "Active batches", value: "31" },
            { label: "Freshness alerts", value: "4" },
            { label: "Reserved stock", value: "1.8t" },
            { label: "Stock corrections", value: "3" },
          ],
        },
        {
          title: "Credit queue",
          metrics: [
            { label: "Diajukan petugas kredit", value: "18" },
            { label: "Need approval", value: "5" },
            { label: "Medium risk", value: "7" },
            { label: "High risk", value: "2", status: "review" },
          ],
        },
        {
          title: "Persetujuan Pengajuan Kredit",
          metrics: [
            { label: "Menunggu persetujuan", value: String(pendingCreditCount) },
          ],
          cta: { label: "Lihat pengajuan", href: "/manager/approvals" },
        },
        {
          title: "Approval Queue",
          span: "full",
          actions: [
            { label: "Approve pinjaman", description: "Keputusan akhir pengajuan anggota" },
            { label: "Approve perubahan nilai", description: "Perubahan sensitif butuh manager" },
            { label: "Approve stock correction", description: "Koreksi stok dari staff gudang" },
            { label: "Request collateral", description: "Minta jaminan untuk risiko menengah" },
          ],
        },
        {
          title: "Sensitive changes",
          span: "full",
          tone: "orange",
          metrics: [
            { label: "Loan amount changed", value: "2" },
            { label: "Before disbursement", value: "1" },
            { label: "Fast approval risk", value: "1" },
            { label: "Audit logged", value: "14" },
          ],
        },
        {
          title: "Akses bawahan",
          span: "full",
          description:
            "Manager dapat melihat ringkasan operasi staff, input pinjaman petugas kredit, dan semua approval yang membutuhkan otorisasi.",
        },
        {
          title: "Management report",
          span: "full",
          tone: "forest",
          metrics: [
            { label: "Approved today", value: "8" },
            { label: "Rejected", value: "2" },
            { label: "Pending follow-up", value: "6" },
            { label: "Report ready", value: "Live" },
          ],
        },
      ]}
    />
  );
}
