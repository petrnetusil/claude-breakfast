export const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
export const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
/** "v pondělí", "ve středu" … */
export const DAY_ON = ['v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu', 'v neděli'];
const MONTHS_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** The Monday after `from` (a Monday maps to the Monday a week later). */
export function nextMonday(from: Date = new Date()): string {
  const dow = from.getDay(); // 0 = Sunday
  const diff = (8 - dow) % 7 || 7;
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + diff);
  return toIso(d);
}

export function dayNumber(iso: string): number {
  return fromIso(iso).getDate();
}

export function longDate(iso: string): string {
  const d = fromIso(iso);
  return `${d.getDate()}. ${MONTHS_GEN[d.getMonth()]}`;
}

/** "12.–18. října" or "28. září – 4. října" */
export function weekLabel(mondayIso: string): string {
  const a = fromIso(mondayIso);
  const b = fromIso(addDays(mondayIso, 6));
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}.–${b.getDate()}. ${MONTHS_GEN[b.getMonth()]}`;
  return `${a.getDate()}. ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()}. ${MONTHS_GEN[b.getMonth()]}`;
}
