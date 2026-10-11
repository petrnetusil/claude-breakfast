import { describe, expect, it } from 'vitest';
import { parseAmount, parseMinutes, parseServings, toCard, toDetail } from './rohlik';

// Made-up examples in the formats Rohlík uses. No Rohlík data is stored in this repo.

describe('parseAmount', () => {
  const cases: [string, number | null, string | null][] = [
    ['250 g hladké mouky', 250, 'g'],
    ['1,5 kg brambor', 1500, 'g'],
    ['0.5 l mléka', 500, 'ml'],
    ['2 dl smetany', 200, 'ml'],
    ['3 lžíce oleje', 3, 'lžíce'],
    ['4–6 lžic zakysané smetany', 6, 'lžíce'],
    ['4-8 lžic rybí omáčky', 8, 'lžíce'],
    ['1/2 lžičky soli', 0.5, 'lžička'],
    ['1⁄2 lžičky pepře', 0.5, 'lžička'],
    ['½ kávové lžičky sody', 0.5, 'lžička'],
    ['1 polévková lžíce cukru', 1, 'lžíce'],
    ['2 stroužky česneku', 2, 'stroužek'],
    ['1 svazek petrželky', 1, 'svazek'],
    ['2 piece of vejce', 2, 'ks'],
    ['1/2 kusu okurky', 0.5, 'ks'],
    ['3 ks rajčat', 3, 'ks'],
    ['4x pita chleba', 4, null],
    ['2 vejce', 2, null],
    ['200–400 g roštěné', 400, 'g'],
    ['Špetka soli', null, 'špetka'],
    ['Hrst špenátu', null, 'hrst'],
    ['Lžička medu', 1, 'lžička'],
    ['Sůl', null, null],
    ['Najemno nastrouhaná kůra z 1 citronu', null, null],
  ];
  for (const [text, amount, unit] of cases) {
    it(text, () => {
      const r = parseAmount(text);
      if (amount == null) expect(r.amount).toBeNull();
      else expect(r.amount).toBeCloseTo(amount, 5);
      expect(r.unit).toBe(unit);
    });
  }
});

describe('times and portions', () => {
  it('reads minutes', () => {
    expect(parseMinutes('45 min')).toBe(45);
    expect(parseMinutes('1 h 30 min')).toBe(90);
    expect(parseMinutes('2 h')).toBe(120);
    expect(parseMinutes('Do hodinky')).toBeNull();
  });
  it('reads portions', () => {
    expect(parseServings('4 PORCE')).toBe(4);
    expect(parseServings('4 Porcí')).toBe(4);
    expect(parseServings('20 KUSŮ')).toBeNull();
    expect(parseServings('1 DORT')).toBeNull();
    expect(parseServings('Pro celou rodinu')).toBe(4);
  });
});

describe('Rohlík responses', () => {
  it('turns a card into what the app shows', () => {
    const card = toCard({
      recipeId: 9,
      name: ' Zkušební\npolévka | Rychlá večeře na každý den',
      slug: 'zkusebni-polevka',
      image: { path: 'https://cdn.example/9.jpg' },
      details: [{ text: 'Do hodinky' }, { text: '35 min' }],
      authorName: 'Testovací kuchař',
    });
    expect(card).toEqual({ id: 9, title: 'Zkušební polévka', slug: 'zkusebni-polevka', image: 'https://cdn.example/9.jpg', time: 35, author: 'Testovací kuchař' });
  });

  it('turns a detail into ingredients and steps, without kitchen tools', () => {
    const d = toDetail({
      id: 9,
      name: 'Zkušební polévka',
      link: '/chef/9-zkusebni-polevka',
      totalTimeMinutes: 35,
      servings: [{ name: '6 PORCÍ', default: true }],
      image: { path: '/images/9.jpg' },
      author: { name: 'Testovací kuchař' },
      ingredients: [
        { name: 'SUROVINY', items: [{ name: 'mrkev', ingredientName: '300 g mrkve' }, { name: 'Sůl', ingredientName: 'Špetka soli' }] },
        { name: 'POMŮCKY', items: [{ name: 'Pomůcky na vaření', ingredientName: 'Pomůcky na vaření' }] },
      ],
      directions: [{ name: 'POSTUP', steps: [{ content: 'Nakrájejte. ' }, { content: '' }, { content: 'Uvařte.' }] }],
    });
    expect(d.slug).toBe('9-zkusebni-polevka');
    expect(d.image).toBe('https://cdn.rohlik.cz/images/9.jpg');
    expect(d.servings).toBe(6);
    expect(d.servingsLabel).toBe('6 porcí');
    expect(d.ingredients).toEqual([
      { name: 'Mrkev', text: '300 g mrkve', amount: 300, unit: 'g' },
      { name: 'Sůl', text: 'Špetka soli', amount: null, unit: 'špetka' },
    ]);
    expect(d.steps).toEqual(['Nakrájejte.', 'Uvařte.']);
  });
});
