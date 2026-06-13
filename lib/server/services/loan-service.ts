import "server-only";

import { LoanRepository } from "@/lib/server/repositories/loan-repository";

export class LoanService {
  constructor(private readonly loans: LoanRepository) {}

  listPendingApplications(tenantId: string) {
    return this.loans.listPendingApplications(tenantId);
  }

  countPendingApplications(tenantId: string) {
    return this.loans.countPendingApplications(tenantId);
  }

  approve(loanId: string, approvedByUserId: string) {
    return this.loans.approve(loanId, approvedByUserId);
  }

  reject(loanId: string) {
    return this.loans.reject(loanId);
  }
}
