import "server-only";

import { db } from "@/lib/server/db/client";
import { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import { ScreshBatchRepository } from "@/lib/server/repositories/scresh-batch-repository";
import { ScreshMovementRepository } from "@/lib/server/repositories/scresh-movement-repository";
import { SessionRepository } from "@/lib/server/repositories/session-repository";
import { SupervisorAuditRepository } from "@/lib/server/repositories/supervisor-audit-repository";
import { TenantRepository } from "@/lib/server/repositories/tenant-repository";
import { UserRepository } from "@/lib/server/repositories/user-repository";
import { AuthService } from "@/lib/server/services/auth-service";
import { PasswordService } from "@/lib/server/services/password-service";
import { RbacService } from "@/lib/server/services/rbac-service";
import { ScreshService } from "@/lib/server/services/scresh-service";
import { SessionService } from "@/lib/server/services/session-service";
import { TokenService } from "@/lib/server/services/token-service";

export class ServiceContainer {
  readonly version = 3;
  readonly users = new UserRepository(db);
  readonly tenants = new TenantRepository(db);
  readonly sessions = new SessionRepository(db);
  readonly auditLogs = new AuditLogRepository(db);
  readonly supervisorAudits = new SupervisorAuditRepository(db);
  readonly screshBatches = new ScreshBatchRepository(db);
  readonly screshMovements = new ScreshMovementRepository(db);
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
  readonly scresh = new ScreshService(
    this.screshBatches,
    this.screshMovements,
    this.auditLogs,
  );
}

const globalForServices = globalThis as unknown as {
  screshServices?: ServiceContainer;
};

export const services =
  globalForServices.screshServices?.version === 3
    ? globalForServices.screshServices
    : new ServiceContainer();

if (process.env.NODE_ENV !== "production") {
  globalForServices.screshServices = services;
}
