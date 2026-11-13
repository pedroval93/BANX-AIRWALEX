"use client";

import { useActionState, useOptimistic, startTransition } from "react";
import { setPermission, type PermissionState } from "./actions";

const initial: PermissionState = { error: null };

/** Interruptor de "ve su saldo" / "ve sus movimientos" / "ve los datos de tarjeta". Cambia al instante y se guarda en el servidor. */
export function PermissionSwitch({
  userId,
  permission,
  on,
  label,
}: {
  userId: string;
  permission: "balance" | "transactions" | "card_details";
  on: boolean;
  label: string;
}) {
  const [state, action, pending] = useActionState(setPermission, initial);
  const [shown, setShown] = useOptimistic(on);

  function toggle() {
    const next = !shown;
    const data = new FormData();
    data.set("user_id", userId);
    data.set("permission", permission);
    data.set("value", String(next));
    startTransition(() => {
      setShown(next);
      action(data);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          role="switch"
          className="toggle"
          checked={shown}
          onChange={toggle}
          disabled={pending}
          aria-label={label}
        />
        <span aria-hidden className={`text-sm font-medium ${shown ? "text-ink" : "text-muted"}`}>
          {shown ? "Lo ve" : "Oculto"}
        </span>
      </label>
      {state.error ? (
        <span role="alert" className="max-w-56 text-xs text-danger">
          {state.error}
        </span>
      ) : null}
    </span>
  );
}
