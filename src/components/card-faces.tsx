import { brandLabel } from "@/lib/cards/format";

export type CardFaceData = {
  nickname: string;
  brand?: string;
  number: string; // ya formateado: "•••• •••• •••• 4242" o "4242 4242 4242 4242"
  nameOnCard: string;
  expiry: string; // "09/29" o "••/••"
  cvv: string; // "123" o "•••"
  revealed: boolean;
};

const shell =
  "card-face card-guilloche absolute inset-0 overflow-hidden rounded-[18px] text-white shadow-[0_18px_40px_-18px_rgba(10,30,45,0.65)]";

function BrandMark({ brand }: { brand?: string }) {
  const label = brandLabel(brand);
  if (label === "MASTERCARD") {
    return (
      <span className="flex items-center" aria-label="Mastercard">
        <span className="h-7 w-7 rounded-full bg-[#d9a441]/90" />
        <span className="-ml-3 h-7 w-7 rounded-full bg-white/70 mix-blend-screen" />
      </span>
    );
  }
  return <span className="text-xl font-extrabold italic tracking-tight">{label || "TARJETA"}</span>;
}

function Chip() {
  return (
    <span
      aria-hidden
      className="relative block h-9 w-12 rounded-md bg-gradient-to-br from-[#e6c766] via-brass to-[#9c7a17]"
    >
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
      <span className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
      <span className="absolute inset-y-0 left-2/3 w-px bg-black/25" />
    </span>
  );
}

export function CardFront({ data }: { data: CardFaceData }) {
  return (
    <div className={`${shell} flex flex-col justify-between p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <span className="truncate text-sm text-white/80">{data.nickname}</span>
        <BrandMark brand={data.brand} />
      </div>

      <div className="space-y-4">
        <Chip />
        <p
          className="font-mono text-[clamp(1.05rem,5.2vw,1.45rem)] tracking-[0.12em] [text-shadow:0_1px_0_rgba(0,0,0,0.35)]"
          aria-label={data.revealed ? "Número de tarjeta" : "Número de tarjeta oculto"}
        >
          {data.number}
        </p>
      </div>

      <div className="flex items-end justify-between gap-4 text-sm">
        <span className="truncate font-mono uppercase tracking-wider">{data.nameOnCard}</span>
        <span className="shrink-0 text-right">
          <span className="block text-[0.65rem] text-white/65">Vence</span>
          <span className="font-mono">{data.expiry}</span>
        </span>
      </div>
    </div>
  );
}

export function CardBack({ data }: { data: CardFaceData }) {
  return (
    <div className={`${shell} card-back flex flex-col`}>
      <div className="mt-6 h-11 bg-[#0b141b]" aria-hidden />
      <div className="mt-5 flex items-center gap-3 px-5 sm:px-6">
        <div
          className="h-10 flex-1 rounded-sm bg-[repeating-linear-gradient(-45deg,#e9ecef_0_6px,#d7dce0_6px_12px)]"
          aria-hidden
        />
        <div className="rounded-sm bg-white px-3 py-1.5 text-right text-ink">
          <span className="block text-[0.6rem] text-muted">CVV</span>
          <span className="font-mono text-lg tracking-widest">{data.cvv}</span>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 p-5 text-xs text-white/70 sm:p-6">
        <span className="max-w-[60%]">Tarjeta personal e intransferible.</span>
        <BrandMark brand={data.brand} />
      </div>
    </div>
  );
}

/** Tarjeta estática (frente), para listas. */
export function CardThumb({ data }: { data: CardFaceData }) {
  return (
    <div className="relative aspect-[1.586] w-full">
      <CardFront data={data} />
    </div>
  );
}
