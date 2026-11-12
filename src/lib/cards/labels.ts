import type { CardStatus, CardTransactionStatus } from "@/lib/airwallex/types";

export const CARD_STATUS_LABEL: Record<CardStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  PENDING: "En preparación",
  BLOCKED: "Bloqueada",
  LOST: "Reportada como perdida",
  STOLEN: "Reportada como robada",
  CLOSED: "Cerrada",
  EXPIRED: "Vencida",
  FAILED: "Con error",
  UNKNOWN: "Sin estado",
};

export const TX_STATUS_LABEL: Record<CardTransactionStatus, string | null> = {
  AUTHORIZED: "Pendiente",
  CLEARED: null,
  DECLINED: "Rechazado",
  REVERSED: "Cancelado",
  EXPIRED: "Caducado",
  VERIFIED: "Verificación",
  UNKNOWN: "Sin estado",
};
