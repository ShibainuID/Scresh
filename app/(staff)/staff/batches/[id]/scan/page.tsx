import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { CameraScanner } from "./camera-scanner";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ScanPage({ params }: Props) {
  const { id } = await params;
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const batch = await services.scresh.getBatch(session.user.tenantId, id);

  if (!batch) {
    notFound();
  }

  return (
    <CameraScanner
      batchCode={batch.batch_code}
      batchId={batch.id}
      commodity={batch.commodity}
    />
  );
}
