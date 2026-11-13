"use server";

import { AirwallexError, getIssuing } from "@/lib/airwallex";
import { requireUser } from "@/lib/auth";
import { formatCardNumber, formatExpiry } from "@/lib/cards/format";
import { getMyProfile, userOwnsCard } from "@/lib/data";
import { permissionsOf } from "@/lib/permissions";

// Sin el nombre impreso en la tarjeta: es el de la empresa emisora y no se le muestra al cliente.
export type RevealedDetails = { number: string; cvv: string; expiry: string };
export type RevealResult = { ok: true; details: RevealedDetails } | { ok: false; message: string };

// Trae número completo, vencimiento y CVV desde Airwallex en el momento.
// No se guardan en ningún lado ni se escriben en logs.
export async function revealCardDetails(cardId: string): Promise<RevealResult> {
  const user = await requireUser();
  if (!(await userOwnsCard(user.id, cardId))) {
    return { ok: false, message: "Esta tarjeta no está asignada a tu cuenta." };
  }
  // El admin puede dejar que vea saldo y movimientos pero no el número completo ni el CVV.
  if (!permissionsOf(await getMyProfile(user.id)).cardDetails) {
    return { ok: false, message: "Solo puedes ver la terminación de esta tarjeta." };
  }

  try {
    const d = await getIssuing().getCardDetails(cardId);
    return {
      ok: true,
      details: {
        number: formatCardNumber(d.card_number),
        cvv: d.cvv,
        expiry: formatExpiry(d.expiry_month, d.expiry_year),
      },
    };
  } catch (error) {
    if (error instanceof AirwallexError) {
      if (error.status === 401 || error.status === 403) {
        return {
          ok: false,
          message: "Por ahora no se pueden mostrar los datos completos de esta tarjeta.",
        };
      }
      if (error.status === 400) {
        return {
          ok: false,
          message: "Solo se pueden mostrar los datos de tarjetas virtuales activas.",
        };
      }
    }
    return { ok: false, message: "No se pudieron traer los datos. Intenta de nuevo en un momento." };
  }
}
