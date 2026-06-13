import { RoleShell } from "@/components/role-shell";
import { requireRole } from "@/lib/auth/dal";
import { services } from "@/lib/server/services/container";

export default async function AdminPage() {
  const session = await requireRole(["admin"]);
  const users = await services.users.list();

  return (
    <RoleShell role="admin" session={session}>
      <section className="rounded-lg bg-surface p-5">
        <h2 className="text-3xl">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-forest/10">
                  <td className="py-3 pr-4">{user.name}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{user.roles.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </RoleShell>
  );
}
