import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { isDemoMode } from "@/lib/airwallex";
import type { CurrentUser } from "@/lib/auth";
import { DemoBanner } from "./ui";

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}
      <header className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Mis tarjetas
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user.isAdmin ? (
            <Link href="/admin" className="text-accent hover:underline">
              Administrar
            </Link>
          ) : null}
          <form action={logout}>
            <button type="submit" className="text-muted hover:text-ink">
              Salir
            </button>
          </form>
        </nav>
      </header>
    </>
  );
}
