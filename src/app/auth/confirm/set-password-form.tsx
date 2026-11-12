"use client";

import { useActionState } from "react";
import { setPasswordFromLink, type FormState } from "@/app/auth/actions";
import { Button, ErrorText, Field } from "@/components/ui";

const initial: FormState = { error: null };

export function SetPasswordForm({ tokenHash, type }: { tokenHash: string; type: string }) {
  const [state, action, pending] = useActionState(setPasswordFromLink, initial);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Al menos 8 caracteres."
        required
      />
      <Field
        label="Repite la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
