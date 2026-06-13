import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        aria-label="Log out"
        className="grid h-14 w-14 place-items-center rounded-full bg-lime text-forest transition hover:bg-lime/80 focus:outline-none focus:ring-2 focus:ring-forest/20"
        type="submit"
      >
        <LogOut aria-hidden="true" className="h-7 w-7" strokeWidth={2.25} />
      </button>
    </form>
  );
}
