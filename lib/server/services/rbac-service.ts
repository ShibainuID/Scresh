import "server-only";

import { normalizeRoles, type Role, type SessionPrincipal } from "@/lib/domain/auth";
import { roleHomePath, rolePermissions } from "@/lib/domain/rbac";

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class RbacService {
  hasRole(session: SessionPrincipal, allowedRoles: Role[]) {
    return normalizeRoles(session.user.roles).some((role) =>
      allowedRoles.includes(role),
    );
  }

  hasPermission(session: SessionPrincipal, permission: string) {
    return normalizeRoles(session.user.roles).some((role) => {
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
    const priority: Role[] = [
      "admin",
      "manager",
      "supervisor",
      "credit",
      "partner",
      "staff",
    ];
    const sessionRoles = normalizeRoles(session.user.roles);
    const role = priority.find((candidate) => sessionRoles.includes(candidate));
    return role ? roleHomePath[role] : "/staff";
  }
}
