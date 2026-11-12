"use client";

import { useActionState, useState } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { createPasswordLink, inviteClient, type LinkState } from "./actions";

const initial: LinkState = { error: null, link: null, email: null };

function LinkResult({ state, note }: { state: LinkState; note: string }) {
  const [copied, setCopied] = useState(false);
  if (!state.link) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.link!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-4">
      <p className="text-sm">
        Manda este enlace a <strong>{state.email}</strong>. {note}
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={state.link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs"
          aria-label="Enlace"
        />
        <Button type="button" variant="quiet" onClick={copy}>
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

const LINK_NOTE = "Sirve una sola vez y caduca según el tiempo configurado en Supabase (1 hora por defecto).";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteClient, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="full_name" autoComplete="off" />
        <Field label="Correo" name="email" type="email" autoComplete="off" required />
      </div>
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando enlace…" : "Crear enlace de invitación"}
      </Button>
      <LinkResult state={state} note={LINK_NOTE} />
    </form>
  );
}

export function PasswordLinkForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(createPasswordLink, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-accent hover:underline disabled:opacity-50"
      >
        {pending ? "Creando enlace…" : "Crear enlace para cambiar contraseña"}
      </button>
      <ErrorText>{state.error}</ErrorText>
      <LinkResult state={state} note={LINK_NOTE} />
    </form>
  );
}
