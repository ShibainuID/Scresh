import type { Role, SessionPrincipal } from "@/lib/domain/auth";
import { roleLabels } from "@/lib/domain/rbac";
import { LogoutButton } from "./logout-button";

type RoleShellProps = {
  role: Role;
  session: SessionPrincipal;
  children: React.ReactNode;
};

export function RoleShell({ role, session, children }: RoleShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-4 border-b border-forest/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            {roleLabels[role]} workspace
          </p>
          <h1 className="mt-1 text-5xl">Welcome, {session.user.name}</h1>
        </div>
        <LogoutButton />
      </header>
      {children}
    </main>
  );
}
