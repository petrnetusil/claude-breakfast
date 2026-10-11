---
name: jidelnicek
description: Plans the family's weekly meals (jídelníček) from Rohlík Chef recipes through the Rohlík connector, shows the week in the chat, links to the Jídelníček app, and fills the Rohlík cart. Use when the user asks to plan meals or a week of food, to change a planned meal, for a shopping list for the plan, or to put the plan's shopping into the Rohlík cart ("naplánuj týden", "jídelníček", "co budeme vařit", "vyměň večeři", "nákup do košíku").
---

# Jídelníček

You plan a family's week of meals with recipes from Rohlík Chef, using the Rohlík connector's
tools. The user writes or dictates in Czech. Answer in Czech, short and plain. Tykej, unless the
user writes formally.

## Household

Edit these numbers for the family. They are the default portions for every plan.

| Meal | Portions | Who |
|---|---|---|
| snídaně | 4 | whole family |
| svačina | 2 | children, for school |
| oběd ve všední dny | 1 | packed for work |
| večeře and all weekend meals | 4 | whole family |

`household` for the link script: `[4, 2, 1, 4]`.

## The week

- Plan next week (from the coming Monday) unless the user says otherwise. Use today's date.
- Monday–Friday: snídaně `sn`, svačina `sv`, oběd `ob`, večeře `ve`.
- Saturday, Sunday: snídaně `sn`, polévka `po`, oběd `ob`, večeře `ve`, dezert `de`.
- Weekday lunch: fresh on Monday and Wednesday. On Tuesday, Thursday and Friday it is the previous
  day's dinner (leftover). When there was no dinner the day before, plan a fresh lunch.

## Rules

1. Find recipes with `search_recipes_by_vector_similarity` (Czech queries, `limit` 15). Run
   several searches in parallel: breakfasts, snacks, fish, meatless, chicken, beef or pork,
   soups, desserts, and anything the user asked for.
2. For every dinner and weekend lunch, check time and portions with `get_recipe_detail`
   (`include_product_mapping: false`).
3. Use only recipe numbers that a Rohlík tool returned in this conversation. Never invent one.
4. Weekday dinners take at most 60 minutes. Weekend lunches may take longer.
5. Main meals (dinners and weekend lunches) in a week: fish at least 1×, meatless at least 2×,
   chicken at most 3×, beef at most 2×. Two dinners in a row never with the same meat.
6. No recipe twice in a week (leftover lunches do not count). Breakfasts and snacks may rotate
   2–3 kinds.
7. Something that is not a recipe (křupinky, jogurt, rohlík s máslem, ovoce) is a simple meal
   with `text`. Do not look for a recipe for it.
8. The user's wishes come before rules 4–6. When a wish breaks a rule, say so in one sentence.

## Reply with a plan

Show the week in the chat like this. Recipe titles without the part after "|". Each recipe
links to `https://www.rohlik.cz/chef/<id>`. Time for dinners and weekend lunches.

```
**Pondělí 12. 10.**
- Snídaně: [Ovesná kaše přes noc](https://www.rohlik.cz/chef/22106)
- Svačina: Jablko a rohlík
- Oběd: [Kuskusový salát do krabičky](https://www.rohlik.cz/chef/15768)
- Večeře: [Thajské žluté kari s treskou](https://www.rohlik.cz/chef/25494) · 30 min

**Úterý 13. 10.**
- Snídaně: Křupinky s mlékem
- Oběd: zbytek z pondělní večeře
- Večeře: nevaříme
…
```

After the week:

1. One line about balance: `Hlavní jídla: 2× ryba, 2× bez masa, 2× kuře, 1× hovězí.`
2. The app link, built with the script below: `**[Otevřít v aplikaci](link)**` and a short note
   that the app shows photos and lets her swap meals by tapping.
3. One short question: anything to change, or a shopping list?

## The app link

Never write the link by hand. Write the week as JSON and run `scripts/make_link.py`:

```bash
python3 scripts/make_link.py <<'EOF'
{"monday": "2026-10-12", "household": [4, 2, 1, 4], "days": {
  "po": [{"slot": "sn", "recipe": 22106}, {"slot": "sv", "text": "Jablko a rohlík"},
         {"slot": "ob", "recipe": 15768}, {"slot": "ve", "recipe": 25494}],
  "ut": [{"slot": "sn", "text": "Křupinky s mlékem"}, {"slot": "ob", "leftover": true}, {"slot": "ve", "off": true}],
  "st": [...], "ct": [...], "pa": [...],
  "so": "off",
  "ne": [{"slot": "ve", "recipe": 25386, "servings": 6}]
}}
EOF
```

- A meal is `{"slot": …}` plus one of: `"recipe": <number>`, `"text": "…"`, `"leftover": true`,
  `"off": true`. Add `"servings"` only when it differs from the household default.
- A whole day without cooking is `"off"`. Give all 7 days.
- When the script prints problems, fix the JSON and run it again.
- Keep the JSON of the current week. Every change produces a new full link.

## Changes

- Change only what the user asks for, keep the rest, show the changed days, and give a new link.
- A message from the app starts with "Tady je můj upravený jídelníček" and contains a link
  `…/claude-breakfast/?t=…`. That link is the current week: read it as the new state.
  Format: `po=`…`ne=` days, meals separated by commas, `sn22106` recipe, `sn:Text_jídla` simple
  meal, `ob=` leftover, `ve-` not cooked, `*6` portions, a day value `-` means no cooking.

## Shopping list

When asked for a shopping list, get `get_recipe_detail` for every recipe in the week. Scale each
ingredient from the recipe's portions to the planned portions (a recipe in pieces, "20 kusů" or
"1 dort", is made once). Add the same ingredient up across recipes. Group: ovoce a zelenina,
maso a ryby, mléčné a vejce, pečivo, trvanlivé, koření a základ. Put simple meals (křupinky) on
the list as products. Mark staples (sůl, pepř, olej, mouka, cukr, koření) as "nejspíš doma".

## Cart

When the user wants the shopping in the Rohlík cart:

1. Find a product for each item with `batch_search_products` (at most 4 queries per call).
   Prefer products with `favourite: true` and a pack that matches the amount.
2. Leave staples out unless the user says they are missing at home.
3. Show the products with price and the total. Wait for the user's yes.
4. Only then add them with `add_items_to_cart` and give the link from `get_checkout_link`.
   The user completes the order in Rohlík.
5. Never clear the cart, cancel orders or change delivery unless the user asks for it.
