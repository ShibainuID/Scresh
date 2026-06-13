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
  maskDataUrl,
  parseScanResult,
  type ScanResult,
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
  C: { label: "Perlu segera didistribusikan", color: "text-orange" },
  D: { label: "Tidak layak didistribusikan", color: "text-red-600" },
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
  if (!blob) {
    throw new Error("Foto gagal diambil.");
  }
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
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Analisis foto gagal.",
        );
      }

      const parsed = parseScanResult(payload);
      setResult(parsed);
      setBarcodeValue(`SCRESH-${Date.now().toString().slice(-8)}`);
      setPhase("result");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Analisis foto gagal.",
      );
      setPhase("camera");
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

  return (
    <main className="fixed inset-0 z-40 overflow-hidden bg-black">
      <div className="relative h-full w-full">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-forest px-8 text-center text-white">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-lime text-forest">
              <CameraOff className="h-10 w-10" strokeWidth={2} />
            </div>
            <p className="text-xl font-semibold">Kamera tidak tersedia</p>
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
                    src={maskDataUrl(result.maskBase64)}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />

        <button
          aria-label="Kembali ke halaman staff"
          className="absolute left-5 top-5 z-20 grid h-12 w-12 place-items-center rounded-full bg-lime text-forest"
          onClick={() => router.push("/staff")}
          type="button"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>

        {!cameraError ? (
          <div
            aria-hidden={phase !== "camera"}
            className={`absolute inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-[32px] bg-white px-5 pb-8 pt-4 text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
              phase === "camera"
                ? "translate-y-0"
                : "pointer-events-none translate-y-[110%]"
            }`}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-forest/15" />
            <div className="flex items-start gap-3">
              <ScanLine className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" />
              <div>
                <p className="font-semibold">Arahkan kamera ke sayuran</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pastikan objek terlihat jelas dan tidak terlalu bertumpuk.
                </p>
              </div>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-semibold">
              Komoditas
              <select
                className="h-12 rounded-xl bg-surface px-4 text-base text-forest outline-none ring-1 ring-forest/15 focus:ring-2 focus:ring-violet-600"
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
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-forest font-bold text-white transition hover:bg-forest/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
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
                <p className="font-semibold">Menganalisis objek</p>
                <p className="text-sm text-muted-foreground">
                  Memisahkan objek dan memeriksa tingkat kesegaran.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div
          aria-hidden={!result || (phase !== "result" && phase !== "select")}
          className={`absolute inset-x-0 bottom-0 z-30 mx-auto max-h-[64vh] max-w-md overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-4 text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.24)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
            result && (phase === "result" || phase === "select")
              ? "translate-y-0"
              : "pointer-events-none translate-y-[110%]"
          }`}
        >
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-forest/15" />
          {result ? (
            phase === "result" ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-violet-700">
                      {result.summary.objectCount} objek tersegmentasi
                    </p>
                    <div className="mt-3 flex items-end gap-3">
                      <p
                        className={`text-6xl font-bold leading-none ${gradeStyle.color}`}
                      >
                        {result.summary.grade}
                      </p>
                      <div className="pb-1">
                        <p className="font-semibold">{gradeStyle.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Confidence {result.summary.confidencePercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-forest"
                    onClick={handleRetake}
                    title="Foto ulang"
                    type="button"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <p className="text-4xl font-semibold">
                    {result.summary.shelfLifeDays}
                  </p>
                  <p className="font-medium text-muted-foreground">
                    hari umur simpan
                  </p>
                </div>
                <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">
                  {result.summary.recommendation}
                </p>

                <button
                  className="mt-5 h-12 w-full rounded-xl bg-forest font-bold text-white"
                  onClick={() => setPhase("select")}
                  type="button"
                >
                  Konfirmasi hasil
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">Simpan hasil scan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Grade {result.summary.grade} akan dicatat ke batch terpilih.
                </p>
                <label className="mt-5 grid gap-2 text-sm font-semibold">
                  Batch tujuan
                  <select
                    className="h-12 rounded-xl bg-surface px-4 text-base text-forest outline-none ring-1 ring-forest/15 focus:ring-2 focus:ring-violet-600"
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

                <div className="mt-5 rounded-xl bg-lime p-4">
                  {barcodeValue ? <BarcodeDisplay value={barcodeValue} /> : null}
                </div>
                <button
                  className="mt-4 h-12 w-full rounded-xl bg-forest font-bold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={handleSave}
                  type="button"
                >
                  {isPending ? "Menyimpan..." : "Simpan ScreshTag"}
                </button>
                <button
                  className="mt-2 h-12 w-full rounded-xl bg-surface font-bold text-forest"
                  onClick={() => setPhase("result")}
                  type="button"
                >
                  Kembali ke hasil
                </button>
              </>
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}
