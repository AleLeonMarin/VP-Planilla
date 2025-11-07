export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCRC(value: number | string | null | undefined): string {
  return `₡${formatNumber(value)}`;
}
