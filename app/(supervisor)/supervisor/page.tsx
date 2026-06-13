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

  const [notifications, unreadCount, counts] = await Promise.all([
    services.notifications.listUnreadByUser(session.user.id, 10),
    services.notifications.countUnreadByUser(session.user.id),
    services.supervisorAudits.getCounts(),
  ]);

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
          metrics: [
            { label: "Anomali aktif", value: String(counts.activeAnomalies) },
            { label: "Butuh penjelasan", value: String(counts.needsExplanation) },
            { label: "Aman", value: String(counts.safeCount) },
            { label: "Pending approval", value: String(counts.pendingApproval) },
          ],
        },
        {
          title: "Aksi Cepat",
          actions: [
            {
              label: "Lihat Audit Trail",
              description: "Daftar perubahan pinjaman dengan filter lengkap.",
              href: "/supervisor/audit",
            },
            {
              label: "Export Laporan",
              description: "Unduh laporan audit dalam format CSV.",
              href: "/supervisor/audit",
            },
          ],
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
