"use client";

import { useEffect, useState, useTransition } from "react";
import { revealCardDetails, type RevealedDetails } from "@/app/tarjetas/actions";
import { Button, ErrorText } from "@/components/ui";
import { CardBack, CardFront, type CardFaceData } from "./card-faces";

const HIDE_AFTER_MS = 60_000;

type Props = {
  cardId: string;
  nickname: string;
  brand?: string;
  maskedNumber: string;
  canReveal: boolean;
};

export function CardVisual({ cardId, nickname, brand, maskedNumber, canReveal }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [details, setDetails] = useState<RevealedDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Los datos se ocultan solos después de un minuto.
  useEffect(() => {
    if (!details) return;
    const timer = setTimeout(() => setDetails(null), HIDE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [details]);

  const face: CardFaceData = {
    nickname,
    brand,
    number: details?.number ?? maskedNumber,
    expiry: details?.expiry ?? "••/••",
    cvv: details?.cvv ?? "•••",
    revealed: Boolean(details),
  };

  // Inclinación leve siguiendo el mouse (no en pantallas táctiles).
  function tilt(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    const inner = e.currentTarget.firstElementChild as HTMLElement | null;
    inner?.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    inner?.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);
  }

  function untilt(e: React.PointerEvent<HTMLButtonElement>) {
    const inner = e.currentTarget.firstElementChild as HTMLElement | null;
    inner?.style.setProperty("--tilt-x", "0deg");
    inner?.style.setProperty("--tilt-y", "0deg");
  }

  function reveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealCardDetails(cardId);
      if (result.ok) setDetails(result.details);
      else setError(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        onPointerMove={tilt}
        onPointerLeave={untilt}
        className="card-scene block w-full cursor-pointer rounded-[4.2%/6.66%] text-left"
        aria-label={flipped ? "Ver el frente de la tarjeta" : "Ver el reverso de la tarjeta"}
      >
        <div className="card-tilt">
          <div className="card-flipper relative aspect-[1.586] w-full" data-flipped={flipped}>
            <CardFront data={face} />
            <CardBack data={face} />
          </div>
        </div>
      </button>

      <div className="flex flex-wrap gap-2">
        {canReveal ? (
          details ? (
            <Button variant="quiet" onClick={() => setDetails(null)}>
              Ocultar datos
            </Button>
          ) : (
            <Button onClick={reveal} disabled={pending}>
              {pending ? "Trayendo datos…" : "Ver datos"}
            </Button>
          )
        ) : null}
        <Button variant="quiet" onClick={() => setFlipped((f) => !f)}>
          {flipped ? "Ver frente" : "Ver reverso"}
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      {details ? (
        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          <CopyRow label="Número" value={details.number} copyValue={details.number.replace(/\s/g, "")} />
          <CopyRow label="Vence" value={details.expiry} />
          <CopyRow label="CVV" value={details.cvv} />
          <p className="px-4 py-2.5 text-sm text-muted">Se ocultan solos en un minuto.</p>
        </div>
      ) : null}
    </div>
  );
}

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dl>
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="font-mono text-lg">{value}</dd>
      </dl>
      <button
        type="button"
        onClick={copy}
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/10"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
