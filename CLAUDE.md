# Jídelníček – project notes for Claude Code

Family weekly meal planner (Czech UI). One household, used by the owner's wife on phone and iPad.
Vite + React 18 + TypeScript, no UI library, no backend. Hosted on GitHub Pages from `master`.

How it works: the wife plans in a Claude Project ("Jídelníček") with the Rohlík connector. Claude
searches Rohlík Chef recipes and replies with a link to this app; the link carries the week
(recipe ids, simple meals, portions). The app loads everything else live from rohlik.cz.
No Rohlík data may be stored in this repo or cached on the device (owner's rule).

## Commands
- `npm run dev` · `npm test` (vitest) · `npm run typecheck` · `npm run build`

## Layout
- `src/lib/link.ts` – the week link format (`?t=&lid=&po=…&ne=`), parse and write. The same format is
  written by `skill/jidelnicek/scripts/make_link.py` and documented in `docs/claude-projekt.md`.
- `src/lib/rohlik.ts` – live Rohlík endpoints (cards, detail, search), parsing of amounts, portions,
  times. In-memory only while the page is open.
- `src/lib/useRohlik.ts` – hooks for cards and details. `src/lib/planner.ts` – meal resolution.
- `src/lib/shopping.ts` – scaling, aggregation by Rohlík's ingredient name, categories, Czech amounts.
- `src/lib/store.ts` – the only place that mutates state; localStorage key `jidelnicek-v2`
  (week, household portions, favourite ids).
- `src/lib/router.ts` – hash router. Routes: `d/:day`, `swap/:day/:meal`, `recipe/:id[/:day/:meal]`,
  `week`, `shop`, `fav`, `start`.
- `src/screens/*` – one file per screen. `src/components/ui.tsx` – shared pieces.
- `docs/` – setup guide for the wife and the Claude Project instructions (Czech).
- `skill/jidelnicek/` – Claude skill (upload as zip in claude.ai): `SKILL.md` plus
  `scripts/make_link.py`, which builds the week link. Keep `make_link.py`, `src/lib/link.ts` and
  `docs/claude-projekt.md` in the same link format.

## Rules that matter
- Meal slots: sn (snídaně), sv (svačina), po (polévka), ob (oběd), ve (večeře), de (dezert).
- A weekday lunch can be `leftover: true`; it resolves to the previous day's dinner (`resolveMeal`)
  and its portions are added to that dinner in the shopping list.
- A meal is a Rohlík recipe (`recipeId`) or a simple meal without a recipe (`text`, e.g. "Křupinky").
- Only recipes whose yield is in portions are scaled; "20 kusů" or "1 dort" is made once.
- Tests use made-up recipes only. Never commit data copied from Rohlík.
- UI copy is Czech, informal plural ("vyměníte", "nevaříme").
- Touch targets are at least 44 px. Check layouts at 360 px width.

## Next steps
1. Phone/iPad sync (needs a small backend or a shared store).
2. Cart from the app: Rohlík's OAuth only allows approved redirect URIs (github.io is refused), so
   the cart goes through Claude for now. Ask Rohlík about registering the app, or add a backend.
3. English as a setting.
