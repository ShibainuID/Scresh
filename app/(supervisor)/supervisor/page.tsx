import { RoleDashboard } from "@/components/role-dashboard";
import { NotificationDrawer } from "@/components/notification-drawer";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function SupervisorPage() {
  const session = await requireRole(["supervisor", "admin"]);

  // Recalculate anomalies so tenant-wide rules (dominant approver, recurring pair) are current
  if (session.user.tenantId) {
    await services.auditRisk.syncAllTenantAnomalies(session.user.tenantId);
  }

  const [notifications, unreadCount, auditRows] = await Promise.all([
    services.notifications.listUnreadByUser(session.user.id, 10),
    services.notifications.countUnreadByUser(session.user.id),
    services.supervisorAudits.list({}, 200),
  ]);

  const totalAudit = auditRows.length;
  const highRiskCount = auditRows.filter((row) => row.risk >= 70).length;
  const pendingApprovalCount = auditRows.filter((row) => row.status === "pending").length;

  return (
    <RoleDashboard
      activeModule="Audit"
      cooperativeName="Koperasi Melati Jaya"
      headerRight={
        <NotificationDrawer notifications={notifications} unreadCount={unreadCount} />
      }
      location="Bandung, Indonesia"
      role="supervisor"
      roleTitle="Dinas Auditor"
      session={session}
      widgets={[
        {
          title: "Ringkasan Audit",
          tone: "forest",
          span: "full",
          metrics: [
            { label: "Perubahan masuk audit", value: String(totalAudit) },
            { label: "Anomali tinggi", value: String(highRiskCount) },
            { label: "Menunggu approval", value: String(pendingApprovalCount) },
            { label: "Aman", value: "0" },
          ],
        },
        {
          title: "Lihat Audit Trail",
          description: "Daftar perubahan pinjaman dengan filter lengkap.",
          cta: {
            label: "Buka",
            href: "/supervisor/audit",
          },
        },
        {
          title: "Export Laporan",
          description: "Unduh laporan audit dalam format CSV.",
          cta: {
            label: "Export",
            href: "/supervisor/audit",
          },
        },
        {
          title: "Anomali Terbaru",
          span: "full",
          description: notifications.length > 0
            ? notifications[0].message
            : "Tidak ada anomali terbaru yang memerlukan perhatian.",
          cta: {
            label: "Buka audit trail",
            href: "/supervisor/audit",
          },
        },
      ]}
    />
  );
}
