"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/auth/actions";
import { Button, ErrorText, Field } from "@/components/ui";

const initial: FormState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-sm text-muted">
        ¿Olvidaste tu contraseña? Pide un enlace nuevo a quien te invitó.
      </p>
    </form>
  );
}
