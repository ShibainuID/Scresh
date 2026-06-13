import type { Role } from "./auth";

export const roleHomePath: Record<Role, string> = {
  staff: "/staff",
  manager: "/manager",
  supervisor: "/supervisor",
  partner: "/partner",
  admin: "/admin",
};

export const roleLabels: Record<Role, string> = {
  staff: "Staff",
  manager: "Manager",
  supervisor: "Supervisor",
  partner: "Partner",
  admin: "Admin",
};

export const rolePermissions: Record<Role, string[]> = {
  staff: ["members:read", "scresh:scan", "loans:create"],
  manager: ["members:read", "loans:approve", "reports:read"],
  supervisor: ["audit:read", "risk:read", "reports:read"],
  partner: ["financing:read", "portfolio:read"],
  admin: ["*"],
};
