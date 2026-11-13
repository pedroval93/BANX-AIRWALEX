import { redirect } from "next/navigation";
import { BanxLogo } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <BanxLogo />
      <h1 className="mt-10 font-display text-5xl font-semibold leading-none tracking-tight">Tus tarjetas</h1>
      <p className="mt-3 text-muted">Entra con el correo con el que te invitaron.</p>
      <LoginForm />
    </main>
  );
}
