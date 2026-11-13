import { LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { isDemoMode } from "@/lib/airwallex";
import type { CurrentUser } from "@/lib/auth";
import { BanxLogo } from "./brand";
import { DemoBanner } from "./ui";

type Section = "home" | "admin";

function NavLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-2 transition-colors ${
        active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppHeader({ user, section = "home" }: { user: CurrentUser; section?: Section }) {
  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}
      <header className="bg-night text-night-ink">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="Banx, ir a tus tarjetas" className="rounded-md">
            <BanxLogo tagline={false} className="sm:hidden" />
            <BanxLogo className="hidden sm:inline-flex" />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {user.isAdmin ? (
              <>
                <NavLink href="/" active={section === "home"}>
                  Mis tarjetas
                </NavLink>
                <NavLink href="/admin" active={section === "admin"}>
                  Administrar
                </NavLink>
              </>
            ) : null}
            <form action={logout}>
              <button
                type="submit"
                className="ml-1 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-white/75 transition-colors hover:bg-white/8 hover:text-white"
              >
                <LogOut aria-hidden className="size-4" />
                <span>Salir</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
    </>
  );
}
