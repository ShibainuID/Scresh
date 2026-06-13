import "server-only";

import { SignJWT, jwtVerify } from "jose";

type SessionTokenPayload = {
  sessionId: string;
};

export class TokenService {
  private readonly issuer = "scresh";
  private readonly audience = "scresh-web";

  async signSession(payload: SessionTokenPayload, expiresAt: Date) {
    return new SignJWT({ sessionId: payload.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.getSecret());
  }

  async verifySession(token?: string | null): Promise<SessionTokenPayload | null> {
    if (!token) {
      return null;
    }

    try {
      const result = await jwtVerify(token, this.getSecret(), {
        issuer: this.issuer,
        audience: this.audience,
      });

      const sessionId = result.payload.sessionId;

      if (typeof sessionId !== "string") {
        return null;
      }

      return { sessionId };
    } catch {
      return null;
    }
  }

  private getSecret() {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters.");
    }

    return new TextEncoder().encode(secret);
  }
}
