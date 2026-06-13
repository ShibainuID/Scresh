"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, ScanLine, CameraOff } from "lucide-react";

export type BarcodeScannerProps = {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
};

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      controlsRef.current?.abort();
      setError(null);
      setIsStarting(false);
      return;
    }

    const reader = new BrowserMultiFormatReader();
    const abortController = new AbortController();
    controlsRef.current = abortController;

    setIsStarting(true);
    setError(null);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? "video", (result, err) => {
        if (result) {
          onScan(result.getText());
          onClose();
        }
        if (err && err.name !== "NotFoundException") {
          // Ignore normal "no barcode in frame" errors
          console.warn("Scanner error:", err);
        }
      })
      .then(() => {
        setIsStarting(false);
      })
      .catch((scanError) => {
        setIsStarting(false);
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
      abortController.abort();
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-forest px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <ScanLine className="h-5 w-5 text-lime" strokeWidth={2.25} />
          <span className="font-sans text-base font-semibold">Scan ScreshTag</span>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-lime text-forest">
              <CameraOff className="h-10 w-10" strokeWidth={2} />
            </div>
            <p className="font-sans text-xl font-semibold">Kamera tidak tersedia</p>
            <p className="text-sm text-white/75">{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative h-48 w-72 rounded-[18px] border-2 border-lime/70 bg-white/5">
                <div className="absolute -top-1 left-1/2 h-0.5 w-12 -translate-x-1/2 bg-lime" />
                <div className="absolute -bottom-1 left-1/2 h-0.5 w-12 -translate-x-1/2 bg-lime" />
              </div>
              <p className="mt-5 text-sm font-medium text-white/90">
                Arahkan barcode ke dalam kotak
              </p>
            </div>
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <p className="font-sans text-base font-semibold">Memulai kamera...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
