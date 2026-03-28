// Czech public holidays (státní svátky)
// Fixed-date holidays: [month, day]
const FIXED_HOLIDAYS: [number, number][] = [
  [1, 1],   // Den obnovy samostatného českého státu / Nový rok
  [1, 6],   // Svátek Tří králů
  [5, 1],   // Svátek práce
  [5, 8],   // Den vítězství
  [7, 6],   // Den upálení mistra Jana Husa
  [9, 28],  // Den české státnosti
  [10, 28], // Den vzniku samostatného československého státu
  [11, 17], // Den boje za svobodu a demokracii
  [12, 24], // Štědrý den
  [12, 25], // 1. svátek vánoční
  [12, 26], // 2. svátek vánoční
];

/**
 * Compute Easter Sunday using the Anonymous Gregorian algorithm.
 * Returns [month, day] (1-indexed).
 */
function getEasterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

/**
 * Get Easter-related holiday dates for a given year.
 * Returns Good Friday, Easter Sunday, Easter Monday as [month, day] tuples.
 */
function getEasterHolidays(year: number): [number, number][] {
  const [eMonth, eDay] = getEasterSunday(year);
  const easterDate = new Date(year, eMonth - 1, eDay);

  // Good Friday = Easter - 2 days
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);

  // Easter Monday = Easter + 1 day
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return [
    [goodFriday.getMonth() + 1, goodFriday.getDate()],
    [eMonth, eDay],
    [easterMonday.getMonth() + 1, easterMonday.getDate()],
  ];
}

export function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Check fixed holidays
  for (const [hMonth, hDay] of FIXED_HOLIDAYS) {
    if (month === hMonth && day === hDay) return true;
  }

  // Check Easter-related holidays
  for (const [hMonth, hDay] of getEasterHolidays(year)) {
    if (month === hMonth && day === hDay) return true;
  }

  return false;
}

export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export function isWeekendOrHoliday(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

const CZECH_DAY_NAMES = [
  'Neděle',
  'Pondělí',
  'Úterý',
  'Středa',
  'Čtvrtek',
  'Pátek',
  'Sobota',
];

export function getCzechDayName(date: Date): string {
  return CZECH_DAY_NAMES[date.getDay()];
}

export function formatCzechDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}.`;
}
