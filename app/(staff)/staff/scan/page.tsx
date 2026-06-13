import { requireRole } from "@/lib/auth/dal";
import { ScanFlow } from "./scan-flow";

export default async function ScanPage() {
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  return <ScanFlow />;
}
