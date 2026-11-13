// Quién puede ver cada tarjeta. Una tarjeta puede tener varios clientes.

/** Por cada tarjeta, los clientes que la ven (en el orden en que vienen). */
export function clientsByCard(clients: { id: string; cardIds: string[] }[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const client of clients) {
    for (const cardId of client.cardIds) {
      const ids = map.get(cardId);
      if (ids) ids.push(client.id);
      else map.set(cardId, [client.id]);
    }
  }
  return map;
}

/** "Ana", "Ana y Luis", "Ana, Luis y 2 más"; "Sin asignar" si nadie la ve. */
export function ownersLabel(names: string[]): string {
  if (names.length === 0) return "Sin asignar";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}
