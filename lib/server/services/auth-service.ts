import "server-only";

import type { AuthResult, Role } from "@/lib/domain/auth";
import { AuditLogRepository } from "@/lib/server/repositories/audit-log-repository";
import { UserRepository } from "@/lib/server/repositories/user-repository";
import { PasswordService } from "@/lib/server/services/password-service";
import { SessionService } from "@/lib/server/services/session-service";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<AuthResult> {
    const existingUser = await this.users.findByEmail(input.email);

    if (existingUser) {
      return { ok: false, message: "A user with this email already exists." };
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? "staff",
    });

    if (!user) {
      return { ok: false, message: "Could not create the user." };
    }

    const session = await this.sessions.create(user.id);
    await this.auditLogs.record({
      actorUserId: user.id,
      action: "auth.register",
      resourceType: "user",
      resourceId: user.id,
    });

    return { ok: true, ...session };
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);

    if (!user || !user.isActive) {
      return { ok: false, message: "Invalid email or password." };
    }

    const validPassword = await this.passwords.verify(
      input.password,
      user.passwordHash,
    );

    if (!validPassword) {
      return { ok: false, message: "Invalid email or password." };
    }

    const session = await this.sessions.create(user.id);
    await this.auditLogs.record({
      actorUserId: user.id,
      action: "auth.login",
      resourceType: "session",
      resourceId: session.session.sessionId,
    });

    return { ok: true, ...session };
  }

  async logout(token?: string | null) {
    await this.sessions.revokeCookieToken(token);
  }
}
