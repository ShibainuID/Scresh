import "server-only";

import type { Role, SessionPrincipal } from "@/lib/domain/auth";
import { roleHomePath, rolePermissions } from "@/lib/domain/rbac";

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class RbacService {
  hasRole(session: SessionPrincipal, allowedRoles: Role[]) {
    return session.user.roles.some((role) => allowedRoles.includes(role));
  }

  hasPermission(session: SessionPrincipal, permission: string) {
    return session.user.roles.some((role) => {
      const permissions = rolePermissions[role];
      return permissions.includes("*") || permissions.includes(permission);
    });
  }

  assertRole(session: SessionPrincipal, allowedRoles: Role[]) {
    if (!this.hasRole(session, allowedRoles)) {
      throw new AuthorizationError();
    }
  }

  getPrimaryHome(session: SessionPrincipal) {
    const priority: Role[] = ["admin", "manager", "supervisor", "partner", "staff"];
    const role = priority.find((candidate) => session.user.roles.includes(candidate));
    return role ? roleHomePath[role] : "/staff";
  }
}
