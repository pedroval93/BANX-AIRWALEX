import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...input}
        className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent"
      />
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: "primary" | "quiet" | "danger" } & ComponentProps<"button">) {
  const styles = {
    primary: "bg-accent text-accent-ink hover:opacity-90",
    quiet: "border border-line bg-surface hover:border-accent",
    danger: "text-danger hover:underline",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function DemoBanner() {
  return (
    <div className="bg-brass/20 px-4 py-2 text-center text-sm text-ink">
      Modo de prueba: estas tarjetas y movimientos son de ejemplo. Conecta las claves de Airwallex
      para ver las reales.
    </div>
  );
}
