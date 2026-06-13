import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";

export default async function SupervisorPage() {
  const session = await requireRole(["supervisor", "admin"]);

  return (
    <RoleDashboard
      activeModule="Audit"
      cooperativeName="Koperasi Melati Jaya"
      location="Bandung, Indonesia"
      role="supervisor"
      roleTitle="Dinas Auditor"
      session={session}
      widgets={[
        {
          title: "Perubahan pinjaman",
          tone: "forest",
          metrics: [
            { label: "Flag terbuka", value: "8" },
            { label: "Perubahan nominal", value: "3" },
            { label: "Dekat disbursement", value: "2" },
            { label: "Butuh klarifikasi", value: "5" },
          ],
        },
        {
          title: "Analisis Risiko",
          metrics: [
            { label: "Pinjaman sangat mencurigakan", value: "3" },
            { label: "Nilai pinjaman naik ekstrem", value: "1" },
            { label: "Disetujui terlalu cepat", value: "2" },
            { label: "Petugas dan manager sering berpasangan", value: "4" },
          ],
        },
        {
          title: "Audit trail peminjaman",
          span: "full",
          description:
            "Buka tabel pemeriksaan perubahan pinjaman lengkap dengan before/after, approval status, dan masking.",
          cta: {
            label: "Buka audit trail",
            href: "/supervisor/audit",
          },
        },
      ]}
    />
  );
}
