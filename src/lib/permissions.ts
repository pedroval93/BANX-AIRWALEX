// Qué puede ver cada cliente. Lo decide el admin.
// - balance: gasto del mes y saldo disponible del límite.
// - transactions: la lista de movimientos.

export type Permissions = { balance: boolean; transactions: boolean };

type ProfileFlags = { show_balance?: boolean | null; show_transactions?: boolean | null };

export function permissionsOf(profile: ProfileFlags | null | undefined): Permissions {
  if (!profile) return { balance: false, transactions: false };
  const transactions = profile.show_transactions ?? false;
  // Antes de correr la migración 0002 no existe show_balance: se usa el permiso de siempre.
  const balance = profile.show_balance ?? transactions;
  return { balance, transactions };
}
