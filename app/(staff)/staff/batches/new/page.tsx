"use client";

import { useActionState, useEffect, useState } from "react";
import { registerBatchAction } from "@/app/actions/scresh";
import { PageHeader } from "@/components/page-header";
import {
  getDraftCommodityLabel,
  parseScanDraft,
  SCAN_DRAFT_STORAGE_KEY,
  type ScanDraft,
} from "../../scan/scan-draft";

export default function NewBatchPage() {
  const [state, action, isPending] = useActionState(registerBatchAction, {});
  const [scanDraft, setScanDraft] = useState<ScanDraft | null>(null);
  const [commodity, setCommodity] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const draft = parseScanDraft(
        sessionStorage.getItem(SCAN_DRAFT_STORAGE_KEY),
      );
      if (!draft) return;
      sessionStorage.removeItem(SCAN_DRAFT_STORAGE_KEY);
      setScanDraft(draft);
      setCommodity(getDraftCommodityLabel(draft.commodity));
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-7 md:px-8">
        <PageHeader backHref="/staff/batches" title="Terima Batch Baru" />

        {state.message && (
          <div className="rounded-[18px] bg-orange/10 p-4 text-sm font-semibold text-orange">
            {state.message}
          </div>
        )}

        <form action={action} className="rounded-[28px] bg-white p-6">
          {scanDraft ? (
            <div className="mb-7 rounded-[18px] bg-violet-50 p-4 text-sm text-violet-950">
              <p className="font-bold">Hasil scan siap disimpan</p>
              <p className="mt-1">
                Grade {scanDraft.grade} · Confidence{" "}
                {scanDraft.confidencePercent}% · Umur simpan{" "}
                {scanDraft.shelfLifeDays} hari
              </p>
              <input name="scanGrade" type="hidden" value={scanDraft.grade} />
              <input
                name="scanConfidencePercent"
                type="hidden"
                value={scanDraft.confidencePercent}
              />
              <input
                name="scanShelfLifeDays"
                type="hidden"
                value={scanDraft.shelfLifeDays}
              />
            </div>
          ) : null}

          <div className="grid gap-7">
            <Field label="Supplier" required>
              <input
                autoComplete="organization"
                className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                name="supplierName"
                placeholder="Contoh: Pak Maman Supplier Cabai"
                required
                type="text"
              />
            </Field>

            <Field label="Komoditas" required>
              <input
                autoComplete="off"
                className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                name="commodity"
                onChange={(event) => setCommodity(event.target.value)}
                placeholder="Contoh: Cabai Merah"
                required
                type="text"
                value={commodity}
              />
            </Field>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Berat klaim (kg)" required>
                <input
                  className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                  min="0"
                  name="claimedWeightKg"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>

              <Field label="Berat aktual (kg)" required>
                <input
                  className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                  min="0"
                  name="actualWeightKg"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>

            <Field label="Harga beli (Rp/kg)" required>
              <input
                className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                min="0"
                name="buyPricePerKg"
                placeholder="0"
                required
                step="1"
                type="number"
              />
            </Field>

            <Field label="Lokasi cold storage">
              <input
                className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                name="storageLocation"
                placeholder="Contoh: Cold Room A-02"
                type="text"
              />
            </Field>

            <Field label="Foto sampel sayur">
              <input
                accept="image/*"
                className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-lime file:px-3 file:py-1 file:text-sm file:font-semibold file:text-forest placeholder:text-[#646464] focus:border-forest focus:ring-0"
                name="samplePhoto"
                type="file"
              />
              <p className="mt-2 text-xs text-forest/60">
                Unggah foto contoh untuk dokumentasi kualitas.
              </p>
            </Field>
          </div>

          <button
            className="mt-10 h-14 w-full rounded-[10px] bg-forest text-base font-bold text-white transition hover:bg-forest/95 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Menyimpan..."
              : scanDraft
                ? "Simpan Batch"
                : "Simpan & Lanjut Scan Freshness"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-3 text-base font-semibold text-forest">
      <span>
        {label}
        {required ? <span className="text-orange"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
