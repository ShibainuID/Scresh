"use client";

import { useMemo } from "react";

export type Grade = "A" | "B" | "C" | "D";

export type SegmentationSparklesProps = {
  maskUrl: string;
  grade: Grade;
  particleCount?: number;
};

const gradeTint: Record<Grade, string> = {
  A: "#b5e930",
  B: "#eab308",
  C: "#f86812",
  D: "#dc2626",
};

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    hash = (hash << 5) - hash + code;
    hash |= 0;
  }
  return hash;
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
}

export function SegmentationSparkles({
  maskUrl,
  grade,
  particleCount = 24,
}: SegmentationSparklesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => {
        const base = hashString(`${maskUrl}-${grade}-${index}`);
        return {
          id: index,
          left: seededRandom(base) * 100,
          top: seededRandom(base + 1) * 100,
          size: 2 + seededRandom(base + 2) * 3,
          delay: seededRandom(base + 3) * 2,
          duration: 1.2 + seededRandom(base + 4) * 0.8,
        };
      }),
    [maskUrl, grade, particleCount],
  );

  return (
    <div
      aria-hidden="true"
      className="sparkle-layer"
      style={{
        WebkitMaskImage: `url("${maskUrl}")`,
        maskImage: `url("${maskUrl}")`,
      }}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="sparkle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            boxShadow: `0 0 6px 1px ${gradeTint[grade]}`,
            ["--sparkle-delay" as string]: `${particle.delay}s`,
            ["--sparkle-duration" as string]: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
