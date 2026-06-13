import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeRoles, type Role, type SessionPrincipal } from "@/lib/domain/auth";
import { services } from "@/lib/server/services/container";
import { sessionCookieName } from "./cookies";

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  return services.sessionService.verifyCookieToken(token);
});

export async function requireSession(): Promise<SessionPrincipal> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const sessionRoles = normalizeRoles(session.user.roles);
  const normalizedSession: SessionPrincipal = {
    ...session,
    user: {
      ...session.user,
      roles: sessionRoles,
    },
  };

  if (sessionRoles.length === 0) {
    redirect("/login");
  }

  if (!services.rbac.hasRole(normalizedSession, roles)) {
    redirect(services.rbac.getPrimaryHome(normalizedSession));
  }

  return normalizedSession;
}
