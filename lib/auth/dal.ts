import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, SessionPrincipal } from "@/lib/domain/auth";
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

  try {
    services.rbac.assertRole(session, roles);
    return session;
  } catch {
    redirect(services.rbac.getPrimaryHome(session));
  }
}
