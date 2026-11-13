// Isotipo BANX: la X de dos barras a 45°. Dibujado en SVG para que se vea nítido a cualquier tamaño.

export function BanxMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="132 132 336 336"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <polygon points="132,185 185,132 468,415 415,468" fill="currentColor" />
      <polygon points="415,132 468,185 185,468 132,415" fill="currentColor" />
    </svg>
  );
}

/** "Banx not Banks.": la X, "Banx" en negrita y "not Banks." en ligera. */
export function BanxLogo({ className = "", tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BanxMark className="size-5 text-accent" />
      <span className="text-[1.05rem] leading-none tracking-tight">
        <span className="font-bold">Banx</span>
        {tagline ? <span className="font-light"> not Banks.</span> : null}
      </span>
    </span>
  );
}
