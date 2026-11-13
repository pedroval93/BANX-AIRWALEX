import { brandLabel } from "@/lib/cards/format";
import { BanxMark } from "./brand";

export type CardFaceData = {
  nickname: string;
  brand?: string;
  number: string; // ya formateado: "•••• •••• •••• 4242" o "4242 4242 4242 4242"
  // El nombre impreso en la tarjeta (el de la empresa emisora) no se muestra al cliente.
  expiry: string; // "09/29" o "••/••"
  cvv: string; // "123" o "•••"
  revealed: boolean;
};

// Todo se mide en "cqw" (% del ancho de la tarjeta): la tarjeta se ve igual de grande o de chica,
// el número siempre cabe en una línea y nada se sale del borde.
const shell =
  "card-face absolute inset-0 overflow-hidden rounded-[4.2%/6.66%] bg-[#2f3b3b] text-white shadow-[0_24px_48px_-24px_rgba(20,30,30,0.7)] ring-1 ring-white/10";

// Logotipo de Visa (trazo de Simple Icons, CC0), en blanco como en las tarjetas.
const VISA_PATH =
  "M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z";

function Network({ brand }: { brand?: string }) {
  const label = brandLabel(brand);
  if (label === "VISA") {
    return (
      <svg viewBox="0 8.1 24 7.8" className="h-[5.4cqw] w-auto" role="img" aria-label="Visa">
        <path d={VISA_PATH} fill="currentColor" />
      </svg>
    );
  }
  if (label === "MASTERCARD") {
    return (
      <svg viewBox="0 0 24 15" className="h-[8cqw] w-auto" role="img" aria-label="Mastercard">
        <circle cx="7.5" cy="7.5" r="7.5" fill="#eb001b" />
        <circle cx="16.5" cy="7.5" r="7.5" fill="#f79e1b" />
        <path d="M12 1.5a7.5 7.5 0 0 1 0 12a7.5 7.5 0 0 1 0-12z" fill="#ff5f00" />
      </svg>
    );
  }
  return <span className="text-[4.5cqw] font-semibold leading-none">{label || "Tarjeta"}</span>;
}

function Chip() {
  return (
    <span aria-hidden className="relative block h-[8.5cqw] w-[11.5cqw] rounded-[1.4cqw] bg-[#c0c0c0]">
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
      <span className="absolute inset-y-0 left-1/3 w-px bg-black/20" />
      <span className="absolute inset-y-0 left-2/3 w-px bg-black/20" />
    </span>
  );
}

/** El ancho del contenedor define las unidades cqw de la cara. */
function Face({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`${shell} ${className}`}>
      <div className="absolute inset-0 [container-type:inline-size]">{children}</div>
    </div>
  );
}

export function CardFront({ data }: { data: CardFaceData }) {
  return (
    <Face>
      {/* La X de marca, grande y recortada fuera del borde. */}
      <BanxMark className="absolute -right-[13%] -top-[24%] w-[62%] text-[#e84c00]" />

      <div className="relative flex h-full flex-col justify-between p-[6cqw]">
        <span className="max-w-[55%] truncate text-[4.2cqw] font-medium leading-tight text-white/90">
          {data.nickname}
        </span>

        <div>
          <Chip />
          <p
            className="mt-[4cqw] whitespace-nowrap font-mono text-[6.3cqw] leading-none tracking-[0.06em]"
            aria-label={data.revealed ? "Número de tarjeta" : "Número de tarjeta oculto"}
          >
            {data.number}
          </p>
        </div>

        <div className="flex items-end justify-between gap-[4cqw]">
          <span className="flex items-baseline gap-[2cqw]">
            <span className="text-[2.7cqw] text-white/65">Vence</span>
            <span className="font-mono text-[4.2cqw] leading-none">{data.expiry}</span>
          </span>
          <Network brand={data.brand} />
        </div>
      </div>
    </Face>
  );
}

export function CardBack({ data }: { data: CardFaceData }) {
  return (
    <Face className="card-back">
      <div className="flex h-full flex-col">
        <div className="mt-[6.5cqw] h-[11cqw] bg-black" aria-hidden />
        <div className="mt-[5cqw] flex items-center gap-[3cqw] px-[6cqw]">
          <div
            className="h-[10cqw] flex-1 rounded-[0.8cqw] bg-[repeating-linear-gradient(-45deg,#f1f4e6_0_6px,#e8f2c2_6px_12px)]"
            aria-hidden
          />
          <div className="rounded-[0.8cqw] bg-white px-[3cqw] py-[1.4cqw] text-right text-[#2f3b3b]">
            <span className="block text-[2.4cqw] leading-tight text-[#5c6868]">CVV</span>
            <span className="font-mono text-[4.6cqw] leading-tight tracking-widest">{data.cvv}</span>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-[4cqw] p-[6cqw]">
          <BanxMark className="size-[5cqw] text-[#e84c00]" />
          <Network brand={data.brand} />
        </div>
      </div>
    </Face>
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

/** Miniatura para la tabla. */
export function CardMini() {
  return (
    <span
      aria-hidden
      className="relative block h-8 w-[3.2rem] shrink-0 overflow-hidden rounded-[5px] bg-[#2f3b3b] ring-1 ring-black/10"
    >
      <BanxMark className="absolute -right-2 -top-3 h-9 text-[#e84c00]" />
      <span className="absolute bottom-1 left-1.5 h-1.5 w-2.5 rounded-[2px] bg-[#c0c0c0]" />
    </span>
  );
}
