/**
 * South African Rand display: literal `R` + number (no Intl `currency` style —
 * Hermes/ICU can mis-resolve ZAR and show `$` in some RN builds).
 */
export function formatZAR(amount: number): string {
  const n = Number.isNaN(amount) || !Number.isFinite(amount) ? 0 : amount;
  const formatted = n.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R ${formatted}`;
}

export const APP_CURRENCY_CODE = 'ZAR' as const;
