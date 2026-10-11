# Jídelníček – project notes for Claude Code

Family weekly meal planner (Czech UI). One household, used by the owner's wife on phone and iPad.
Vite + React 18 + TypeScript, no UI library, no backend yet. State lives in localStorage.

## Commands
- `npm run dev` · `npm test` (vitest) · `npm run typecheck` · `npm run build`

## Layout
- `src/data/recipes.ts` – 40 seed recipes from Rohlík Chef. Ingredient names are normalised so
  the shopping list can sum them. `servingsStated: false` means the portion count is an estimate.
- `src/lib/planner.ts` – week generation (seeded, deterministic), swap candidates, search, stats.
- `src/lib/shopping.ts` – scaling, aggregation, categories, Czech amount formatting.
- `src/lib/store.ts` – the only place that mutates state; persists to localStorage key `jidelnicek-v1`.
- `src/lib/router.ts` – hash router. Routes: `d/:day`, `swap/:day/:meal`, `recipe/:id[/:day/:meal]`,
  `week`, `shop`, `fav`, `start`.
- `src/screens/*` – one file per screen. `src/components/ui.tsx` – shared pieces.

## Rules that matter
- Meal slots: sn (snídaně), sv (svačina), po (polévka), ob (oběd), ve (večeře), de (dezert).
  Weekdays have sn/sv/ob/ve, weekend days sn/po/ob/ve/de.
- A weekday lunch can be `leftover: true`; it then resolves to the previous day's dinner
  (`resolveMeal`) and its portions are added to that dinner in the shopping list.
- Balance rules are asserted in `src/lib/planner.test.ts` across 40 seeds. Keep them green.
- UI copy is Czech, informal plural ("vyměníte", "nevaříme"). English is a planned setting;
  strings are still inline.
- Touch targets are at least 44 px. Check layouts at 360 px width.

## Next steps, in order
1. Rohlík connection. Official MCP server: https://mcp.rohlik.cz/mcp (OAuth). It offers product
   search, cart management and recipe search. An order is only completed by the customer in
   Rohlík's own interface, so the app fills the cart and hands over. Tool names are not
   documented publicly: connect it in Claude Code (`claude mcp add --transport http rohlik-mcp
   https://mcp.rohlik.cz/mcp`, then `/mcp`) and list them before designing the server.
   Open question: whether a custom app can register as an OAuth client.
2. Small backend (needed for 1 and for phone/iPad sync): stores state per household, talks to
   the Rohlík MCP server, maps shopping items to products.
3. Replace seed recipes with live Rohlík recipes; use real portion counts.
4. Shopping list: map each item to a Rohlík product and pack size, then "add to cart".
5. English as a setting.
