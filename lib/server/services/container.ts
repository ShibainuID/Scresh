import "server-only";

import { db } from "@/lib/server/db/client";
import { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import { AuditReviewRepository } from "@/lib/server/repositories/audit-review-repository";
import { CreditSummaryRepository } from "@/lib/server/repositories/credit-summary-repository";
import { LoanRepository } from "@/lib/server/repositories/loan-repository";
import { MemberConsentRepository } from "@/lib/server/repositories/member-consent-repository";
import { MemberRepository } from "@/lib/server/repositories/member-repository";
import { NotificationRepository } from "@/lib/server/repositories/notification-repository";
import { ScreshBatchRepository } from "@/lib/server/repositories/scresh-batch-repository";
import { ScreshMovementRepository } from "@/lib/server/repositories/scresh-movement-repository";
import { SessionRepository } from "@/lib/server/repositories/session-repository";
import { SupervisorAuditRepository } from "@/lib/server/repositories/supervisor-audit-repository";
import { TenantRepository } from "@/lib/server/repositories/tenant-repository";
import { UserRepository } from "@/lib/server/repositories/user-repository";
import { AuditRiskService } from "@/lib/server/services/audit-risk-service";
import { CreditAssessmentService } from "@/lib/server/services/credit-assessment-service";
import { LoanApplicationService } from "@/lib/server/services/loan-application-service";
import { LoanApprovalService } from "@/lib/server/services/loan-approval-service";
import { AuthService } from "@/lib/server/services/auth-service";
import { LoanService } from "@/lib/server/services/loan-service";
import { PasswordService } from "@/lib/server/services/password-service";
import { RbacService } from "@/lib/server/services/rbac-service";
import { ScreshService } from "@/lib/server/services/scresh-service";
import { SessionService } from "@/lib/server/services/session-service";
import { TokenService } from "@/lib/server/services/token-service";

export class ServiceContainer {
  readonly version = 6;
  readonly users = new UserRepository(db);
  readonly tenants = new TenantRepository(db);
  readonly sessions = new SessionRepository(db);
  readonly auditLogs = new AuditLogRepository(db);
  readonly supervisorAudits = new SupervisorAuditRepository(db);
  readonly loans = new LoanRepository(db);
  readonly screshBatches = new ScreshBatchRepository(db);
  readonly screshMovements = new ScreshMovementRepository(db);
  readonly members = new MemberRepository(db);
  readonly notifications = new NotificationRepository(db);
  readonly auditReviews = new AuditReviewRepository(db);
  readonly memberConsents = new MemberConsentRepository(db);
  readonly creditSummaries = new CreditSummaryRepository(db);
  readonly passwords = new PasswordService();
  readonly tokens = new TokenService();
  readonly sessionService = new SessionService(this.sessions, this.tokens);
  readonly auth = new AuthService(
    this.users,
    this.tenants,
    this.passwords,
    this.sessionService,
    this.auditLogs,
  );
  readonly rbac = new RbacService();
  readonly loanService = new LoanService(this.loans);
  readonly scresh = new ScreshService(
    this.screshBatches,
    this.screshMovements,
    this.auditLogs,
  );
  readonly auditRisk = new AuditRiskService(db);
  readonly creditAssessment = new CreditAssessmentService(
    this.memberConsents,
    this.creditSummaries,
  );
  readonly loanApplications = new LoanApplicationService(db, this.auditLogs);
  readonly loanApprovals = new LoanApprovalService(db, this.auditLogs);
}

const globalForServices = globalThis as unknown as {
  screshServices?: ServiceContainer;
};

export const services =
  globalForServices.screshServices?.version === 6
    ? globalForServices.screshServices
    : new ServiceContainer();

if (process.env.NODE_ENV !== "production") {
  globalForServices.screshServices = services;
}
