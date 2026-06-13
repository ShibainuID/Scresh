export const roles = ["staff", "manager", "supervisor", "partner", "admin"] as const;

export type Role = (typeof roles)[number];

export type UserPrincipal = {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  roles: Role[];
};

export type SessionPrincipal = {
  sessionId: string;
  user: UserPrincipal;
  expiresAt: Date;
};

export type AuthResult =
  | { ok: true; session: SessionPrincipal; token: string }
  | { ok: false; message: string };

export type ActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};
