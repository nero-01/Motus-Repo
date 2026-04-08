/**
 * South African Rand (ZAR) display for the app.
 */
export function formatZAR(amount: number): string {
  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const APP_CURRENCY_CODE = 'ZAR' as const;
