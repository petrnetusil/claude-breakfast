import { describe, expect, it } from 'vitest';
import { parseWeekLink, weekQuery } from './link';

// Made-up recipe ids; the link only carries numbers.
const LINK =
  '?t=2026-10-14&lid=3,2,1,5&po=sn101,sv:Jablko_a_rohlík,ob102*2,ve103&ut=sn:Křupinky_s_mlékem,ob=,ve-&st=VE104*7, sn105 &so=-&ne=po106,de:Zmrzlina';

describe('parseWeekLink', () => {
  const parsed = parseWeekLink(LINK)!;
  const { week, household } = parsed;

  it('reads the week, snapping the date to Monday', () => {
    expect(week.id).toBe('2026-10-12');
    expect(week.days.map((d) => d.date)).toEqual([
      '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    ]);
    expect(household).toEqual({ sn: 3, sv: 2, ob: 1, ve: 5 });
  });

  it('reads recipes, simple meals, leftovers, skipped meals and portions', () => {
    const [mon, tue, wed, thu, , sat, sun] = week.days;
    expect(mon.meals.map((m) => [m.slot, m.recipeId, m.text, m.servings])).toEqual([
      ['sn', 101, null, 3],
      ['sv', null, 'Jablko a rohlík', 2],
      ['ob', 102, null, 2],
      ['ve', 103, null, 5],
    ]);
    expect(tue.meals.map((m) => [m.slot, m.text, m.leftover, m.off])).toEqual([
      ['sn', 'Křupinky s mlékem', false, false],
      ['ob', null, true, false],
      ['ve', null, false, true],
    ]);
    // Order follows the day, whatever order the link uses; case and spaces do not matter.
    expect(wed.meals.map((m) => [m.slot, m.recipeId, m.servings])).toEqual([
      ['sn', 105, 3],
      ['ve', 104, 7],
    ]);
    expect(thu.meals).toEqual([]);
    expect(sat.off).toBe(true);
    expect(sun.meals.map((m) => [m.slot, m.recipeId, m.text, m.servings])).toEqual([
      ['po', 106, null, 5],
      ['de', null, 'Zmrzlina', 5],
    ]);
  });

  it('accepts a link the phone has percent-encoded', () => {
    const encoded = '?t=2026-10-12&po=' + encodeURIComponent('sn:Křupinky_s_mlékem,ve103*6');
    const mon = parseWeekLink(encoded)!.week.days[0];
    expect(mon.meals.map((m) => [m.slot, m.text ?? m.recipeId, m.servings])).toEqual([
      ['sn', 'Křupinky s mlékem', 4],
      ['ve', 103, 6],
    ]);
  });

  it('skips tokens it cannot read and returns null without any day', () => {
    const mon = parseWeekLink('?po=xx1,sn,ve12a,ob:,sn7')!.week.days[0];
    expect(mon.meals.map((m) => [m.slot, m.recipeId])).toEqual([['sn', 7]]);
    expect(parseWeekLink('?t=2026-10-12')).toBeNull();
    expect(parseWeekLink('')).toBeNull();
  });

  it('writes the same week back', () => {
    const query = weekQuery(week, household);
    expect(query).toBe(
      '?t=2026-10-12&lid=3,2,1,5&po=sn101,sv:Jablko_a_rohlík,ob102*2,ve103&ut=sn:Křupinky_s_mlékem,ob=,ve-&st=sn105,ve104*7&ct=&pa=&so=-&ne=po106,de:Zmrzlina',
    );
    expect(parseWeekLink(query)).toEqual(parsed);
  });
});
