"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CameraOff } from "lucide-react";
import { scanFreshnessAction } from "@/app/actions/scresh";
import { getColdStorageShelfLifeDays, type Grade } from "@/app/(staff)/staff/scan/scan-result";
import { BarcodeDisplay } from "@/components/barcode-display";

const gradeOptions: Record<
  string,
  { label: string; confidence: number; shelfLifeDays: number; color: string }
> = {
  A: { label: "Sangat segar", confidence: 95, shelfLifeDays: 7, color: "text-lime" },
  B: { label: "Segar", confidence: 88, shelfLifeDays: 5, color: "text-yellow-500" },
  C: { label: "Perlu segera", confidence: 82, shelfLifeDays: 2, color: "text-orange" },
  D: { label: "Prioritas tinggi", confidence: 78, shelfLifeDays: 1, color: "text-red-600" },
};

function getSimulatedGrade(): string {
  const grades = ["A", "B", "C", "D"];
  return grades[Math.floor(Math.random() * grades.length)];
}

type CameraScannerProps = {
  batchId: string;
  batchCode: string;
  commodity: string;
};

export function CameraScanner({ batchId, batchCode, commodity }: CameraScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [phase, setPhase] = useState<"scanning" | "result">("scanning");
  const [grade, setGrade] = useState("A");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setCameraError(true);
      }
    }

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraError || !streamRef.current) return;

    const simulatedGrade = getSimulatedGrade();
    setGrade(simulatedGrade);
    setBarcodeValue(batchCode);

    const timer = window.setTimeout(() => {
      setPhase("result");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [cameraError, batchCode]);

  async function handleSave() {
    const option = gradeOptions[grade];
    const shelfLifeDays =
      getColdStorageShelfLifeDays(commodity, grade as Grade) ??
      option.shelfLifeDays;
    const formData = new FormData();
    formData.append("batchId", batchId);
    formData.append("grade", grade);
    formData.append("confidenceScore", String(option.confidence));
    formData.append("shelfLifeHours", String(shelfLifeDays * 24));

    startTransition(async () => {
      const result = await scanFreshnessAction({}, formData);

      if (result.message) {
        toast.error(result.message);
        return;
      }

      toast.success("ScreshTag berhasil disimpan.");
      router.push(`/staff/batches/${batchId}/tag`);
    });
  }

  const option = gradeOptions[grade];
  const shelfLifeDays =
    getColdStorageShelfLifeDays(commodity, grade as Grade) ??
    option.shelfLifeDays;

  return (
    <main className="fixed inset-0 z-40 overflow-hidden bg-black">
      <div className="relative h-full w-full">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-forest px-8 text-center text-white">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-lime text-forest">
              <CameraOff className="h-10 w-10" strokeWidth={2} />
            </div>
            <p className="font-sans text-xl font-semibold">Kamera tidak tersedia</p>
            <p className="text-sm text-white/75">
              Izinkan akses kamera untuk memindai sayur, atau gunakan lingkungan dengan kamera.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            className="h-full w-full object-cover"
            playsInline
            muted
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

        <button
          className="absolute left-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-lime text-forest shadow-lg"
          onClick={() => router.push("/staff/batches")}
          type="button"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>

        <div
          className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-500 ease-out ${
            phase === "result" ? "-translate-y-[30%]" : "translate-y-0"
          }`}
        >
          <div className="mx-auto max-w-md">
            {phase === "scanning" ? (
              <div className="rounded-t-[32px] bg-white px-6 pb-10 pt-5 text-center text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest/20" />
                <p className="font-sans text-lg font-semibold">Memindai Sayuran / Scresh Tag...</p>
                <p className="mt-1 text-sm text-forest/70">Arahkan kamera ke sayur</p>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out ${
            phase === "result" ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto max-w-md rounded-t-[32px] bg-white px-6 pb-10 pt-5 text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.25)]">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-forest/20" />

            <p className="text-xs font-medium text-forest/70">
              Confidence {option.confidence}%
            </p>

            <div className="mt-6 flex items-end gap-3">
              <div>
                <p className="text-sm text-forest/70">Grade</p>
                <p className={`font-sans text-6xl font-bold leading-none ${option.color}`}>
                  {grade}
                </p>
              </div>
              <p className="mb-1.5 text-sm font-medium text-forest/70">{option.label}</p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-forest/70">Perkiraan umur simpan</p>
              <p className="font-sans text-4xl font-semibold">
                {shelfLifeDays}{" "}
                <span className="text-xl font-medium text-forest/70">hari</span>
              </p>
            </div>

            <div className="mt-6">
              <label className="grid gap-2 text-sm font-semibold text-forest">
                Nama sayur (manual)
                <input
                  className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
                  defaultValue={commodity}
                  placeholder="Contoh: Cabai Merah"
                  readOnly
                  type="text"
                />
              </label>
            </div>

            <div className="mt-6 rounded-[16px] bg-lime p-4">
              <div className="overflow-hidden rounded-[8px] px-2 py-3">
                {barcodeValue ? <BarcodeDisplay value={barcodeValue} /> : null}
              </div>
              <button
                className="mt-3 h-12 w-full rounded-[10px] bg-forest text-sm font-bold text-white transition hover:bg-forest/95 disabled:opacity-60"
                disabled={isPending}
                onClick={handleSave}
                type="button"
              >
                {isPending ? "Menyimpan..." : "Simpan Scresh Tag"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}