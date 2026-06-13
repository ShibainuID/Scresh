"use client";

import dynamic from "next/dynamic";

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

export function BarcodeDisplay({
  value,
  background = "#b5e930",
  lineColor = "#013425",
}: {
  value: string;
  background?: string;
  lineColor?: string;
}) {
  return (
    <Barcode
      background={background}
      displayValue={false}
      height={64}
      lineColor={lineColor}
      value={value}
      width={2}
    />
  );
}
