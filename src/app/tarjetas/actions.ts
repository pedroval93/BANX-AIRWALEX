"use server";

import { AirwallexError, getIssuing } from "@/lib/airwallex";
import { requireUser } from "@/lib/auth";
import { formatCardNumber, formatExpiry } from "@/lib/cards/format";
import { userOwnsCard } from "@/lib/data";

export type RevealedDetails = { number: string; cvv: string; expiry: string; nameOnCard: string };
export type RevealResult = { ok: true; details: RevealedDetails } | { ok: false; message: string };

// Trae número completo, vencimiento y CVV desde Airwallex en el momento.
// No se guardan en ningún lado ni se escriben en logs.
export async function revealCardDetails(cardId: string): Promise<RevealResult> {
  const user = await requireUser();
  if (!(await userOwnsCard(user.id, cardId))) {
    return { ok: false, message: "Esta tarjeta no está asignada a tu cuenta." };
  }

  try {
    const d = await getIssuing().getCardDetails(cardId);
    return {
      ok: true,
      details: {
        number: formatCardNumber(d.card_number),
        cvv: d.cvv,
        expiry: formatExpiry(d.expiry_month, d.expiry_year),
        nameOnCard: d.name_on_card,
      },
    };
  } catch (error) {
    if (error instanceof AirwallexError) {
      if (error.status === 401 || error.status === 403) {
        return {
          ok: false,
          message: "Airwallex no permite mostrar los datos completos de esta tarjeta por ahora.",
        };
      }
      if (error.status === 400) {
        return {
          ok: false,
          message: "Airwallex solo muestra los datos de tarjetas virtuales activas.",
        };
      }
    }
    return { ok: false, message: "No se pudieron traer los datos. Intenta de nuevo en un momento." };
  }
}
