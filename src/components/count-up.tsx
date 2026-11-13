"use client";

import { useEffect, useState } from "react";

const DURATION_MS = 700;
const numberFormat = (decimals: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Cifra que sube hasta su valor al aparecer. Sin animación si la persona prefiere menos movimiento. */
export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const text = `${numberFormat(decimals).format(shown)}${suffix}`;
  return (
    <span className="tabular-nums">
      <span aria-hidden>{text}</span>
      <span className="sr-only">{`${numberFormat(decimals).format(value)}${suffix}`}</span>
    </span>
  );
}
