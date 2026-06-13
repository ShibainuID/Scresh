import "server-only";

import type { MemberConsentRepository } from "@/lib/server/repositories/member-consent-repository";
import type { CreditSummaryRepository } from "@/lib/server/repositories/credit-summary-repository";

export type CreditAssessment = {
  riskTier: "low" | "medium" | "high";
  score: number;
  reasons: string[];
  crossCooperativeAvailable: boolean;
  crossCooperativeSummaries: {
    tenantName: string;
    activeArrearsCount: number;
    runningLoanCount: number;
    onTimeRatio: number;
    riskTier: string;
  }[];
};

export class CreditAssessmentService {
  constructor(
    private readonly consents: MemberConsentRepository,
    private readonly summaries: CreditSummaryRepository,
  ) {}

  async assess(
    memberId: string,
    memberTenantId: string,
    principalAmount: number,
  ): Promise<CreditAssessment> {
    // Find all member records across tenants by national_id
    // For simplicity in this service, caller passes memberTenantId.
    // We check consent for each other tenant before reading its summary.
    const crossSummaries: CreditAssessment["crossCooperativeSummaries"] = [];

    // We need to discover other tenant IDs. Since repository doesn't expose member lookup by id,
    // we'll let the caller provide them. For this demo, we query summaries directly and check consent.
    const allSummaries = await this.summaries.listCrossCooperativeSummary(memberId, memberTenantId);

    for (const summary of allSummaries) {
      const consent = await this.consents.getConsent(memberId, summary.tenant_id, "credit_summary");
      if (consent?.granted) {
        crossSummaries.push({
          tenantName: summary.tenant_name,
          activeArrearsCount: summary.active_arrears_count,
          runningLoanCount: summary.running_loan_count,
          onTimeRatio: summary.on_time_ratio,
          riskTier: summary.risk_tier,
        });
      }
    }

    const totalRunningLoans = crossSummaries.reduce((sum, s) => sum + s.runningLoanCount, 0);
    const hasArrears = crossSummaries.some((s) => s.activeArrearsCount > 0);
    const avgOnTime = crossSummaries.length > 0
      ? crossSummaries.reduce((sum, s) => sum + s.onTimeRatio, 0) / crossSummaries.length
      : 100;

    let score = 70;
    const reasons: string[] = [];

    if (hasArrears) {
      score -= 30;
      reasons.push("Terdapat tunggakan aktif di koperasi lain");
    }

    if (totalRunningLoans >= 2) {
      score -= 15;
      reasons.push(`Sedang memiliki ${totalRunningLoans} pinjaman aktif lintas koperasi`);
    } else if (totalRunningLoans === 1) {
      score -= 5;
      reasons.push("Memiliki 1 pinjaman aktif lintas koperasi");
    }

    if (avgOnTime < 80) {
      score -= 15;
      reasons.push("Riwayat pembayaran kurang lancar");
    } else if (avgOnTime >= 90) {
      score += 5;
      reasons.push("Riwayat pembayaran lancar");
    }

    if (principalAmount > 20000000) {
      score -= 10;
      reasons.push("Nominal pinjaman di atas Rp 20.000.000");
    }

    const riskTier: CreditAssessment["riskTier"] =
      score >= 75 ? "low" : score >= 50 ? "medium" : "high";

    if (reasons.length === 0) {
      reasons.push("Profil risiko normal");
    }

    return {
      riskTier,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      crossCooperativeAvailable: crossSummaries.length > 0,
      crossCooperativeSummaries: crossSummaries,
    };
  }
}
