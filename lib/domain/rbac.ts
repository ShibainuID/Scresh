import type { Role } from "./auth";

export const roleHomePath: Record<Role, string> = {
  staff: "/staff",
  credit: "/credit",
  manager: "/manager",
  supervisor: "/supervisor",
  partner: "/partner",
  admin: "/admin",
};

export const roleLabels: Record<Role, string> = {
  staff: "Staff",
  credit: "Petugas Kredit",
  manager: "Manager",
  supervisor: "Supervisor",
  partner: "Partner",
  admin: "Admin",
};

export const rolePermissions: Record<Role, string[]> = {
  staff: ["scresh:scan", "stock:move", "reservations:create"],
  credit: ["members:read", "credit:assess", "loans:create"],
  manager: [
    "scresh:scan",
    "stock:move",
    "reservations:create",
    "members:read",
    "credit:assess",
    "loans:create",
    "loans:approve",
    "stock:approve",
    "reports:read",
  ],
  supervisor: ["audit:read", "risk:read", "reports:read"],
  partner: ["financing:read", "portfolio:read"],
  admin: ["*"],
};
