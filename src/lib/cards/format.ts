export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function maskedCardNumber(masked: string | undefined): string {
  const last4 = (masked ?? "").replace(/\D/g, "").slice(-4);
  return `•••• •••• •••• ${last4.padStart(4, "•")}`;
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

export function brandLabel(brand: string | undefined): string {
  return (brand ?? "").toUpperCase();
}

const amountFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "3,645.40 MXN": con el código de moneda, para tablas con varias monedas. */
export function formatAmount(amount: number, currency: string): string {
  return `${amountFormat.format(amount)} ${currency}`;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
