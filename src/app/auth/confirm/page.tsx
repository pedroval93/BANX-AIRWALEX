import { SetPasswordForm } from "./set-password-form";

export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = params.type === "recovery" ? "recovery" : "invite";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        {type === "invite" ? "Crea tu contraseña" : "Cambia tu contraseña"}
      </h1>
      <p className="mt-2 text-muted">
        {type === "invite"
          ? "Con ella entrarás a ver tus tarjetas."
          : "Escribe una contraseña nueva para tu cuenta."}
      </p>
      <SetPasswordForm tokenHash={tokenHash} type={type} />
    </main>
  );
}
