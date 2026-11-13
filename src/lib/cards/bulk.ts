// Lógica de la asignación de varias tarjetas a la vez.

export type Assignment = { userId: string; cardIds: string[] } | { error: string };

/** Lee del formulario el cliente y las tarjetas marcadas (sin repetidas ni vacías). */
export function parseAssignment(formData: FormData): Assignment {
  const userId = String(formData.get("user_id") ?? "").trim();
  const cardIds = [
    ...new Set(
      formData
        .getAll("card_id")
        .map((v) => String(v).trim())
        .filter(Boolean),
    ),
  ];
  if (!userId) return { error: "Elige a qué cliente asignar las tarjetas." };
  if (cardIds.length === 0) return { error: "Marca al menos una tarjeta." };
  return { userId, cardIds };
}

/** Lee las tarjetas marcadas, p. ej. para quitarles el dueño a todas. */
export function parseCardIds(formData: FormData): { cardIds: string[] } | { error: string } {
  const cardIds = [
    ...new Set(
      formData
        .getAll("card_id")
        .map((v) => String(v).trim())
        .filter(Boolean),
    ),
  ];
  if (cardIds.length === 0) return { error: "Marca al menos una tarjeta." };
  return { cardIds };
}

/**
 * Lee a quién quitarle las tarjetas marcadas.
 * Con cliente: solo a ese cliente. Sin cliente (userId null): a todos los que las ven.
 */
export function parseRemoval(
  formData: FormData,
): { userId: string | null; cardIds: string[] } | { error: string } {
  const parsed = parseCardIds(formData);
  if ("error" in parsed) return parsed;
  const userId = String(formData.get("user_id") ?? "").trim() || null;
  return { userId, cardIds: parsed.cardIds };
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Búsqueda del filtro: cada palabra tiene que aparecer, sin importar mayúsculas ni acentos. */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = normalize(text);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
