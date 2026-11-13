// Qué puede ver cada cliente. Lo decide el admin.
// - balance: gasto del mes y saldo disponible del límite.
// - transactions: la lista de movimientos.
// - cardDetails: número completo, vencimiento y CVV. Sin este permiso solo ve la terminación.

export type Permissions = { balance: boolean; transactions: boolean; cardDetails: boolean };

type ProfileFlags = {
  show_balance?: boolean | null;
  show_transactions?: boolean | null;
  show_card_details?: boolean | null;
};

export function permissionsOf(profile: ProfileFlags | null | undefined): Permissions {
  if (!profile) return { balance: false, transactions: false, cardDetails: false };
  const transactions = profile.show_transactions ?? false;
  // Antes de correr la migración 0002 no existe show_balance: se usa el permiso de siempre.
  const balance = profile.show_balance ?? transactions;
  // Antes de la migración 0003 todos podían ver los datos de la tarjeta: se respeta eso.
  const cardDetails = profile.show_card_details ?? true;
  return { balance, transactions, cardDetails };
}
