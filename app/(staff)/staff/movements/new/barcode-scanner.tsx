"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ArrowLeft, CameraOff } from "lucide-react";

export type BarcodeScannerProps = {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
};

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setDetected(false);
      return;
    }

    const reader = new BrowserMultiFormatReader();
    setError(null);
    setDetected(false);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? "video", (result, err) => {
        if (detected) return;
        if (result) {
          setDetected(true);
          onScan(result.getText());
          onClose();
        }
        if (err && err.name !== "NotFoundException") {
          console.warn("Scanner error:", err);
        }
      })
      .catch((scanError) => {
        setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
        console.error("Scanner init error:", scanError);
      });

    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      <div className="relative h-full w-full">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-forest px-8 text-center text-white">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-lime text-forest">
              <CameraOff className="h-10 w-10" strokeWidth={2} />
            </div>
            <p className="font-sans text-xl font-semibold">Kamera tidak tersedia</p>
            <p className="text-sm text-white/75">{error}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay className="h-full w-full object-cover" playsInline muted />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

        <button
          className="absolute left-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-lime text-forest shadow-lg"
          onClick={onClose}
          type="button"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>

        {!error && (
          <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-0">
            <div className="mx-auto max-w-md rounded-t-[32px] bg-white px-6 pb-10 pt-5 text-center text-forest shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-forest/20" />
              <p className="font-sans text-lg font-semibold">Memindai ScreshTag...</p>
              <p className="mt-1 text-sm text-forest/70">Arahkan barcode ke dalam bingkai kamera</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}