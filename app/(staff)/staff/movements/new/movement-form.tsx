"use client";

import { useActionState, useState } from "react";
import { recordMovementAction } from "@/app/actions/scresh";
import type { ScreshBatchRow } from "@/lib/server/repositories/scresh-batch-repository";
import { BarcodeScanner } from "./barcode-scanner";
import { ScanLine } from "lucide-react";

const movementTypes = [
  { value: "distribution", label: "Distribusi ke offtaker/pasar" },
  { value: "waste", label: "Waste / buang" },
  { value: "return", label: "Return dari offtaker" },
  { value: "claim", label: "Klaim kembali ke supplier" },
];

export function MovementForm({
  batches,
  selectedBatchId,
}: {
  batches: ScreshBatchRow[];
  selectedBatchId?: string;
}) {
  const [state, action, isPending] = useActionState(recordMovementAction, {});
  const [batchId, setBatchId] = useState(selectedBatchId ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const selectedBatch = batches.find((b) => b.id === batchId);

  function handleScan(value: string) {
    const matched = batches.find(
      (b) => b.batch_code.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (matched) {
      setBatchId(matched.id);
    } else {
      alert(`Batch dengan barcode "${value}" tidak ditemukan.`);
    }
  }

  return (
    <>
      <form action={action} className="rounded-[28px] bg-white p-6">
        {state.message && (
          <div className="mb-7 rounded-[18px] bg-orange/10 p-4 text-sm font-semibold text-orange">
            {state.message}
          </div>
        )}

        <div className="grid gap-7">
          <Field label="Scan barcode / Batch ID" required>
            <div className="flex items-end gap-2">
              <input
                className="h-11 flex-1 border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                onChange={(e) => {
                  const code = e.target.value.trim();
                  const matched = batches.find((b) => b.batch_code === code);
                  if (matched) {
                    setBatchId(matched.id);
                  }
                }}
                placeholder="Scan atau ketik Batch ID"
                type="text"
                value={selectedBatch?.batch_code ?? ""}
              />
              <button
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime text-forest transition hover:bg-lime/90"
                onClick={() => setScannerOpen(true)}
                type="button"
              >
                <ScanLine className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <p className="mt-2 text-xs text-forest/60">
              Scan ScreshTag akan mengisi batch secara otomatis.
            </p>
          </Field>

          <Field label="Batch" required>
            <select
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition focus:border-forest focus:ring-0"
            name="batchId"
            onChange={(e) => setBatchId(e.target.value)}
            required
            value={batchId}
          >
            <option value="">Pilih batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_code} — {batch.commodity} (sisa {batch.remaining_weight_kg} kg)
              </option>
            ))}
          </select>
        </Field>

        {selectedBatch && (
          <div className="rounded-[18px] bg-surface p-4 text-sm leading-relaxed text-forest">
            <p>
              <span className="font-semibold">Supplier:</span> {selectedBatch.supplier_name}
            </p>
            <p>
              <span className="font-semibold">Grade:</span> {selectedBatch.freshness_grade.toUpperCase()}
            </p>
            <p>
              <span className="font-semibold">Sisa stok:</span> {selectedBatch.remaining_weight_kg} kg
            </p>
          </div>
        )}

        <Field label="Jenis pergerakan" required>
          <select
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition focus:border-forest focus:ring-0"
            name="movementType"
            required
          >
            <option value="">Pilih jenis</option>
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jumlah (kg)" required>
          <input
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
            max={selectedBatch?.remaining_weight_kg}
            min="0.01"
            name="quantityKg"
            placeholder="0.00"
            required
            step="0.01"
            type="number"
          />
        </Field>

        <Field label="Tujuan / keterangan" required>
          <input
            className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
            name="destination"
            placeholder="Contoh: Pasar Mitra Ciroyom"
            required
            type="text"
          />
        </Field>

        <Field label="Catatan tambahan">
          <textarea
            className="min-h-[88px] w-full resize-none border-0 border-b border-forest/15 bg-transparent px-0 py-3 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
            name="notes"
            placeholder="Opsional: alasan waste, nomor DO, dll"
            rows={3}
          />
        </Field>
      </div>

      <button
        className="mt-10 h-14 w-full rounded-[10px] bg-forest text-base font-bold text-white transition hover:bg-forest/95 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Menyimpan..." : "Simpan Pergerakan Stok"}
      </button>
    </form>

    <BarcodeScanner
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={handleScan}
    />
    </>
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
