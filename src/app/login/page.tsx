import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mis tarjetas</h1>
      <p className="mt-2 text-muted">Entra con el correo con el que te invitaron.</p>
      <LoginForm />
    </main>
  );
}
