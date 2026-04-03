export function formatDateToISO(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatISOToDisplay(isoString: string | Date | null): string {
  if (!isoString) return '';
  const dateStr = typeof isoString === 'string'
    ? isoString.split('T')[0]
    : isoString.toISOString().split('T')[0];

  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function getEndOfMonthISO(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return formatDateToISO(lastDay);
}

export function generateDayNames(): string[] {
  const baseDate = new Date(2024, 0, 1, 12, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
  });
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
