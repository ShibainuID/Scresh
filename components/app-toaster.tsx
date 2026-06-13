"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      duration={4000}
      mobileOffset={{ bottom: 16, left: 16, right: 16 }}
      offset={{ bottom: 24, right: 24 }}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-forest/15 bg-white text-forest shadow-[0_18px_42px_rgba(1,52,37,0.16)]",
          title: "text-sm font-semibold text-forest",
          description: "text-sm text-[#646464]",
          actionButton:
            "rounded-[6px] bg-forest px-3 py-1.5 text-sm font-semibold text-white",
          cancelButton:
            "rounded-[6px] bg-surface px-3 py-1.5 text-sm font-semibold text-forest",
          closeButton:
            "border border-forest/15 bg-white text-forest hover:bg-surface",
          success: "border-lime/60",
          info: "border-forest/20",
          warning: "border-orange/60",
          error: "border-orange bg-orange/10",
        },
      }}
    />
  );
}
