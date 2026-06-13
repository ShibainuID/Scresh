import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth/dal";

export default async function CreditPage() {
  const session = await requireRole(["credit", "manager", "admin"]);

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
          title: "Assessment queue",
          metrics: [
            { label: "Pengajuan baru", value: "18" },
            { label: "Menunggu profil", value: "5" },
            { label: "Perlu review", value: "7" },
            { label: "Siap diajukan", value: "6" },
          ],
        },
        {
          title: "Credit risk tier",
          metrics: [
            { label: "Low risk", value: "11" },
            { label: "Medium risk", value: "7" },
            { label: "High risk", value: "2", status: "manager review" },
            { label: "Auto eligible", value: "9" },
          ],
        },
        {
          title: "Profil anggota",
          span: "full",
          metrics: [
            { label: "Identitas terverifikasi", value: "231" },
            { label: "Anggota lintas koperasi", value: "34" },
            { label: "Profil belum lengkap", value: "12" },
            { label: "Consent aktif", value: "86%" },
          ],
        },
        {
          title: "Credit history",
          span: "full",
          metrics: [
            { label: "On-time ratio", value: "92%" },
            { label: "Active arrears", value: "3" },
            { label: "Running loan count", value: "42" },
            { label: "Exposure flagged", value: "5" },
          ],
        },
        {
          title: "Safe data sharing",
          span: "full",
          actions: [
            { label: "Isi pengajuan pinjaman", description: "Catat kebutuhan dan tujuan pembiayaan" },
            { label: "Lihat credit summary", description: "Ringkasan lintas koperasi tanpa raw data" },
            { label: "Minta consent", description: "Aktifkan izin berbagi data aman" },
            { label: "Hitung risk score", description: "Rule-based Low / Medium / High" },
          ],
        },
      ]}
    />
  );
}
