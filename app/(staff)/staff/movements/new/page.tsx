import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { PageHeader } from "@/components/page-header";
import { MovementForm } from "./movement-form";

type Props = {
  searchParams: Promise<{ batchId?: string }>;
};

export default async function NewMovementPage({ searchParams }: Props) {
  const { batchId } = await searchParams;
  const session = await requireRole(["staff", "manager", "admin"]);

  if (!session.user.tenantId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime px-5 py-7 text-forest">
        <p>Akun tidak terhubung ke koperasi.</p>
      </main>
    );
  }

  const batches = await services.scresh.listBatches(session.user.tenantId);
  const selectedBatch = batchId
    ? await services.scresh.getBatch(session.user.tenantId, batchId)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-7 md:px-8">
        <PageHeader backHref="/staff/movements" title="Scan / Catat Keluar" />

        <MovementForm batches={batches} selectedBatchId={selectedBatch?.id} />
      </div>
    </main>
  );
}
