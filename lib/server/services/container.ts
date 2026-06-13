import "server-only";

import { db } from "@/lib/server/db/client";
import { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import { SessionRepository } from "@/lib/server/repositories/session-repository";
import { UserRepository } from "@/lib/server/repositories/user-repository";
import { AuthService } from "@/lib/server/services/auth-service";
import { PasswordService } from "@/lib/server/services/password-service";
import { RbacService } from "@/lib/server/services/rbac-service";
import { SessionService } from "@/lib/server/services/session-service";
import { TokenService } from "@/lib/server/services/token-service";

export class ServiceContainer {
  readonly users = new UserRepository(db);
  readonly sessions = new SessionRepository(db);
  readonly auditLogs = new AuditLogRepository(db);
  readonly passwords = new PasswordService();
  readonly tokens = new TokenService();
  readonly sessionService = new SessionService(this.sessions, this.tokens);
  readonly auth = new AuthService(
    this.users,
    this.passwords,
    this.sessionService,
    this.auditLogs,
  );
  readonly rbac = new RbacService();
}

const globalForServices = globalThis as unknown as {
  screshServices?: ServiceContainer;
};

export const services =
  globalForServices.screshServices ?? new ServiceContainer();

if (process.env.NODE_ENV !== "production") {
  globalForServices.screshServices = services;
}
