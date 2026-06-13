"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  LoaderCircle,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { scanFreshnessAction } from "@/app/actions/scresh";
import { BarcodeDisplay } from "@/components/barcode-display";
import type { ScreshBatchRow } from "@/lib/server/repositories/scresh-batch-repository";
import {
  getScanErrorMessage,
  parseScanResult,
  type ScanResult,
  visualizationDataUrl,
} from "./scan-result";

const commodities = [
  { value: "chili", label: "Cabai" },
  { value: "lettuce", label: "Selada" },
  { value: "potato", label: "Kentang" },
  { value: "tomato", label: "Tomat" },
  { value: "onion", label: "Bawang" },
];

const gradeStyles: Record<string, { label: string; color: string }> = {
  A: { label: "Sangat segar", color: "text-lime" },
  B: { label: "Segar", color: "text-yellow-500" },
  C: { label: "Perlu segera", color: "text-orange" },
  D: { label: "Prioritas tinggi", color: "text-red-600" },
};

type Phase = "camera" | "analyzing" | "result" | "select";

async function captureFrame(video: HTMLVideoElement): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context || !canvas.width || !canvas.height) {
    throw new Error("Kamera belum siap. Coba lagi sebentar.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Foto gagal diambil.");

  return new File([blob], `scresh-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

export function ScanFlow({ batches }: { batches: ScreshBatchRow[] }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [phase, setPhase] = useState<Phase>("camera");
  const [commodity, setCommodity] = useState("chili");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        });
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch {
        setCameraError(true);
      }
    }

    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function handleCapture() {
    if (!videoRef.current) return;

    try {
      const image = await captureFrame(videoRef.current);
      const nextPreviewUrl = URL.createObjectURL(image);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      setResult(null);
      setPhase("analyzing");

      const body = new FormData();
      body.set("commodity", commodity);
      body.set("image", image);
      const response = await fetch("/api/v1/scresh/scan", {
        method: "POST",
        body,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getScanErrorMessage(payload, "Analisis foto gagal."),
        );
      }

      const parsed = parseScanResult(payload);
      setResult(parsed);
      setBarcodeValue(`SCRESH-${Date.now().toString().slice(-8)}`);
      setPhase("result");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Analisis foto gagal.";
      toast.error(
        message === "No produce objects detected"
          ? "Sayuran tidak terdeteksi. Dekatkan kamera dan hindari pantulan cahaya."
          : message,
      );
      handleRetake();
    }
  }

  function handleRetake() {
    setResult(null);
    setPreviewUrl("");
    setPhase("camera");
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  async function handleSave() {
    if (!result || !selectedBatchId) {
      toast.error("Pilih batch tujuan penyimpanan.");
      return;
    }

    const formData = new FormData();
    formData.append("batchId", selectedBatchId);
    formData.append("grade", result.summary.grade);
    formData.append(
      "confidenceScore",
      String(result.summary.confidencePercent),
    );
    formData.append(
      "shelfLifeHours",
      String(result.summary.shelfLifeDays * 24),
    );

    startTransition(async () => {
      const saveResult = await scanFreshnessAction({}, formData);
      if (saveResult.message) {
        toast.error(saveResult.message);
        return;
      }
      toast.success("ScreshTag berhasil disimpan.");
      router.push(`/staff/batches/${selectedBatchId}/tag`);
    });
  }

  const gradeStyle = result
    ? gradeStyles[result.summary.grade]
    : gradeStyles.A;
  const resultVisible = Boolean(
    result && (phase === "result" || phase === "select"),
  );

  return (
    <main className="fixed inset-0 z-40 overflow-hidden bg-black">
      <div className="relative h-full w-full">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-forest px-8 text-center text-white">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-lime text-forest">
              <CameraOff className="h-10 w-10" strokeWidth={2} />
            </div>
            <p className="font-sans text-xl font-semibold">
              Kamera tidak tersedia
            </p>
            <p className="text-sm text-white/75">
              Izinkan akses kamera untuk memindai sayur.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              className={`h-full w-full object-cover ${
                phase === "camera" ? "block" : "hidden"
              }`}
              playsInline
              muted
            />
            {previewUrl ? (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Foto sayuran yang dianalisis"
                  className="h-full w-full object-cover"
                  src={previewUrl}
                />
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                    src={visualizationDataUrl(
                      result.visualizationMediaType,
                      result.visualizationBase64,
                    )}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

        <button
          aria-label="Kembali ke halaman staff"
          className="absolute left-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-lime text-forest shadow-lg"
          onClick={() => router.push("/staff")}
          type="button"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>

        {!cameraError ? (
          <div
            aria-hidden={phase !== "camera"}
            className={`absolute inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-[32px] bg-white px-6 pb-10 pt-5 text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-out motion-reduce:transition-none ${
              phase === "camera"
                ? "translate-y-0"
                : "pointer-events-none translate-y-[110%]"
            }`}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-forest/20" />
            <div className="flex items-start gap-3 text-left">
              <ScanLine className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" />
              <div>
                <p className="font-sans font-semibold">
                  Arahkan kamera ke sayuran
                </p>
                <p className="mt-1 text-sm text-forest/60">
                  Pastikan objek terlihat jelas dan tidak terlalu bertumpuk.
                </p>
              </div>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-semibold">
              Komoditas
              <select
                className="h-12 rounded-[14px] bg-surface px-4 text-base text-forest outline-none ring-1 ring-forest/15 focus:ring-2 focus:ring-violet-600"
                onChange={(event) => setCommodity(event.target.value)}
                value={commodity}
              >
                {commodities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-forest font-bold text-white transition hover:bg-forest/95"
              onClick={handleCapture}
              type="button"
            >
              <Camera className="h-5 w-5" />
              Ambil foto
            </button>
          </div>
        ) : null}

        <div
          aria-hidden={phase !== "analyzing"}
          aria-live="polite"
          className={`absolute inset-x-5 bottom-7 z-20 mx-auto max-w-md rounded-[24px] bg-white p-5 text-forest shadow-[0_12px_40px_rgba(0,0,0,0.24)] transition-all duration-300 motion-reduce:transition-none ${
            phase === "analyzing"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-8 opacity-0"
          }`}
        >
          {phase === "analyzing" ? (
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-50">
                <LoaderCircle className="h-6 w-6 animate-spin text-violet-600 motion-reduce:animate-none" />
              </div>
              <div>
                <p className="font-sans font-semibold">Menganalisis objek</p>
                <p className="text-sm text-forest/60">
                  Memisahkan objek dan memeriksa tingkat kesegaran.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div
          aria-hidden={!resultVisible}
          className={`absolute inset-x-0 bottom-0 z-30 mx-auto max-h-[68vh] max-w-md overflow-y-auto rounded-t-[32px] bg-white px-6 pb-10 pt-5 text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-out motion-reduce:transition-none ${
            resultVisible
              ? "translate-y-0"
              : "pointer-events-none translate-y-full"
          }`}
        >
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-forest/20" />
          {result && phase === "result" ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-violet-700">
                    {result.summary.objectCount} objek tersegmentasi
                  </p>
                  <p className="mt-1 text-xs font-medium text-forest/70">
                    Confidence {result.summary.confidencePercent}%
                  </p>
                </div>
                <button
                  aria-label="Ambil foto ulang"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface"
                  onClick={handleRetake}
                  type="button"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <div>
                  <p className="text-sm text-forest/70">Grade</p>
                  <p
                    className={`font-sans text-6xl font-bold leading-none ${gradeStyle.color}`}
                  >
                    {result.summary.grade}
                  </p>
                </div>
                <p className="mb-1.5 text-sm font-medium text-forest/70">
                  {gradeStyle.label}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-forest/70">
                  Perkiraan umur simpan
                </p>
                <p className="font-sans text-4xl font-semibold">
                  {result.summary.shelfLifeDays}{" "}
                  <span className="text-xl font-medium text-forest/70">
                    hari
                  </span>
                </p>
              </div>

              <p className="mt-5 rounded-[16px] bg-violet-50 p-4 text-sm leading-6 text-violet-950">
                {result.summary.recommendation}
              </p>

              <button
                className="mt-5 h-12 w-full rounded-[10px] bg-forest text-sm font-bold text-white"
                onClick={() => setPhase("select")}
                type="button"
              >
                Konfirmasi hasil
              </button>
            </>
          ) : null}

          {result && phase === "select" ? (
            <>
              <p className="font-sans text-lg font-semibold">
                Konfirmasi penyimpanan
              </p>
              <p className="mt-1 text-sm text-forest/70">
                Scan Grade {result.summary.grade} akan disimpan ke batch yang
                dipilih.
              </p>
              <label className="mt-5 grid gap-2 text-sm font-semibold">
                Batch tujuan
                <select
                  className="h-11 w-full border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none focus:border-forest"
                  onChange={(event) =>
                    setSelectedBatchId(event.target.value)
                  }
                  value={selectedBatchId}
                >
                  <option value="">Pilih batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_code} - {batch.commodity}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-6 rounded-[16px] bg-lime p-4">
                <div className="overflow-hidden rounded-[8px] px-2 py-3">
                  {barcodeValue ? (
                    <BarcodeDisplay value={barcodeValue} />
                  ) : null}
                </div>
                <button
                  className="mt-3 h-12 w-full rounded-[10px] bg-forest text-sm font-bold text-white disabled:opacity-60"
                  disabled={isPending || !selectedBatchId}
                  onClick={handleSave}
                  type="button"
                >
                  {isPending ? "Menyimpan..." : "Simpan Scresh Tag"}
                </button>
                <button
                  className="mt-2 h-12 w-full rounded-[10px] bg-white text-sm font-bold text-forest"
                  onClick={() => setPhase("result")}
                  type="button"
                >
                  Kembali
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
