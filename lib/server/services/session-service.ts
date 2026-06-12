import "server-only";

import type { SessionPrincipal } from "@/lib/domain/auth";
import { SessionRepository } from "@/lib/server/repositories/session-repository";
import { TokenService } from "@/lib/server/services/token-service";

export class SessionService {
  private readonly ttlMs = 1000 * 60 * 60 * 24 * 7;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async create(userId: string) {
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const sessionId = await this.sessions.create(userId, expiresAt);
    const token = await this.tokens.signSession({ sessionId }, expiresAt);
    const session = await this.sessions.findActiveById(sessionId);

    if (!session) {
      throw new Error("Session creation failed.");
    }

    return { session, token };
  }

  async verifyCookieToken(token?: string | null): Promise<SessionPrincipal | null> {
    const payload = await this.tokens.verifySession(token);

    if (!payload) {
      return null;
    }

    return this.sessions.findActiveById(payload.sessionId);
  }

  async revokeCookieToken(token?: string | null) {
    const payload = await this.tokens.verifySession(token);

    if (payload) {
      await this.sessions.revoke(payload.sessionId);
    }
  }
}
