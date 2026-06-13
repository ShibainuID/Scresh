"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-lime py-4 font-bold text-forest transition hover:bg-lime/85"
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="h-5 w-5" />
      Cetak Label
    </button>
  );
}
