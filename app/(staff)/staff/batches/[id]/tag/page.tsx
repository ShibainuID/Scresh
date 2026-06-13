import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";
import { BarcodeDisplay } from "@/components/barcode-display";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TagPage({ params }: Props) {
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

  const gradeColor = gradeColors[batch.freshness_grade] ?? gradeColors.pending;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-7 md:px-8">
        <PageHeader backHref="/staff/batches" title="ScreshTag" />

        <section className="rounded-[32px] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-forest/70">
                ScreshTag
              </p>
              <p className="mt-1 font-sans text-2xl font-bold">{batch.batch_code}</p>
            </div>
            <div
              className={`rounded-[16px] px-4 py-2 text-center ${gradeColor.bg} ${gradeColor.text}`}
            >
              <p className="text-3xl font-bold">{batch.freshness_grade.toUpperCase()}</p>
              <p className="text-xs font-semibold">Grade</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <TagField label="Komoditas" value={batch.commodity} />
            <TagField label="Supplier" value={batch.supplier_name} />
            <TagField label="Berat aktual" value={`${batch.actual_weight_kg} kg`} />
            <TagField label="Sisa stok" value={`${batch.remaining_weight_kg} kg`} />
            <TagField label="Confidence" value={`${batch.confidence_score}%`} />
            <TagField label="Shelf life" value={`${batch.shelf_life_hours} jam`} />
            <TagField label="Cold storage" value={batch.storage_location ?? "-"} />
            <TagField label="Prioritas" value={`#${batch.distribution_priority}`} />
          </div>

          {batch.sample_photo_url ? (
            <div className="mt-5 overflow-hidden rounded-[20px] bg-surface p-2">
              <Image
                alt={`Foto sampel ${batch.commodity}`}
                className="h-48 w-full rounded-[14px] object-cover"
                height={300}
                src={batch.sample_photo_url}
                width={600}
              />
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-center rounded-[20px] bg-surface p-6">
            <BarcodeDisplay value={batch.batch_code} />
          </div>

          <p className="mt-4 text-center text-sm font-medium text-forest/70">
            Scan untuk traceability, reservasi, dan distribusi.
          </p>
        </section>

        <div className="flex gap-3">
          <PrintButton />
          <Link
            className="flex flex-1 items-center justify-center rounded-[14px] bg-forest py-4 font-bold text-white transition hover:bg-forest/90"
            href="/staff/movements/new"
          >
            Scan Distribusi
          </Link>
        </div>
      </div>
    </main>
  );
}

function TagField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-forest/70">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

const gradeColors: Record<
  string,
  { bg: string; text: string }
> = {
  A: { bg: "bg-lime", text: "text-forest" },
  B: { bg: "bg-yellow-300", text: "text-forest" },
  C: { bg: "bg-orange", text: "text-white" },
  D: { bg: "bg-red-600", text: "text-white" },
  pending: { bg: "bg-surface", text: "text-forest/70" },
};
