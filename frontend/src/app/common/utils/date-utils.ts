const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatDateToISO = (date: Date | string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : toLocalISO(d);
};

export const formatISOToDisplay = (isoString: string | Date | null): string => {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('es-ES').format(new Date(isoString));
};

export function generateDayNames(): string[] {
  const baseDate = new Date(2024, 0, 1, 12, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
  });
}

export const getTodayISO = (): string => toLocalISO(new Date());
