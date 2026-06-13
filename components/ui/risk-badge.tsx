export function RiskBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-white">
        Risk {score}
      </span>
    );
  }
  if (score >= 50) {
    return (
      <span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-forest">
        Risk {score}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-forest/20 bg-white px-2.5 py-1 text-xs font-bold text-forest">
      Risk {score}
    </span>
  );
}
