#!/usr/bin/env python3
"""Build the Jídelníček app link for a planned week.

Reads the week as JSON (a file path argument, or stdin) and prints the link. Exits with code 1
and a list of problems when the input is wrong, so a broken link never reaches the user.

Input:
{
  "monday": "2026-10-12",                  # any date in the week; it snaps to Monday
  "household": [4, 2, 1, 4],               # portions: snídaně, svačina, oběd ve všední dny, večeře
  "days": {
    "po": [{"slot": "sn", "recipe": 22106},
           {"slot": "sv", "text": "Jablko a rohlík"},
           {"slot": "ob", "recipe": 15768},
           {"slot": "ve", "recipe": 25494}],
    "ut": [{"slot": "ob", "leftover": true}, {"slot": "ve", "off": true},
           {"slot": "sn", "recipe": 22106, "servings": 6}],
    "so": "off",                           # the whole day without cooking
    ...                                    # all of po ut st ct pa so ne
  }
}

The link format must match src/lib/link.ts in the app repository.
"""

import datetime
import json
import re
import sys

BASE = "https://petrnetusil.github.io/claude-breakfast/"
DAYS = ["po", "ut", "st", "ct", "pa", "so", "ne"]
SLOTS = ["sn", "sv", "po", "ob", "ve", "de"]


def default_servings(household, slot, day_idx):
    sn, sv, ob, ve = household
    if slot == "sn":
        return sn
    if slot == "sv":
        return sv
    if slot == "ob" and day_idx < 5:
        return ob
    return ve


def clean_text(text):
    """Same rule as cleanText in the app: no characters that break the link, at most 60."""
    text = re.sub(r"[,&#*=]", " ", str(text))
    return re.sub(r"\s+", " ", text).strip()[:60]


def meal_token(meal, day, day_idx, household, problems):
    where = f"{day}: {json.dumps(meal, ensure_ascii=False)}"
    slot = meal.get("slot")
    if slot not in SLOTS:
        problems.append(f"{where} – slot must be one of {SLOTS}")
        return None
    if meal.get("off"):
        return f"{slot}-"
    if meal.get("leftover"):
        body = "="
    elif meal.get("recipe") is not None:
        rid = meal["recipe"]
        if not (isinstance(rid, int) or (isinstance(rid, str) and rid.isdigit())) or int(rid) <= 0:
            problems.append(f"{where} – recipe must be a Rohlík recipe number")
            return None
        body = str(int(rid))
    elif meal.get("text"):
        text = clean_text(meal["text"])
        if not text:
            problems.append(f"{where} – empty text")
            return None
        body = ":" + text.replace(" ", "_")
    else:
        problems.append(f"{where} – needs recipe, text, leftover or off")
        return None
    servings = meal.get("servings")
    star = ""
    if servings is not None:
        if not isinstance(servings, int) or not 1 <= servings <= 12:
            problems.append(f"{where} – servings must be 1–12")
            return None
        if servings != default_servings(household, slot, day_idx):
            star = f"*{servings}"
    return f"{slot}{body}{star}"


def build(week):
    problems = []
    try:
        date = datetime.date.fromisoformat(str(week.get("monday", "")))
    except ValueError:
        problems.append("monday must be a date YYYY-MM-DD")
        date = datetime.date.today()
    monday = date - datetime.timedelta(days=date.weekday())

    household = week.get("household", [4, 2, 1, 4])
    if not (isinstance(household, list) and len(household) == 4 and all(isinstance(n, int) and 1 <= n <= 12 for n in household)):
        problems.append("household must be 4 numbers 1–12: snídaně, svačina, oběd, večeře")
        household = [4, 2, 1, 4]

    days = week.get("days", {})
    unknown = [d for d in days if d not in DAYS]
    if unknown:
        problems.append(f"unknown day keys {unknown}; use {DAYS}")
    missing = [d for d in DAYS if d not in days]
    if missing:
        problems.append(f"missing days {missing}; give all 7 (use \"off\" for a day without cooking)")

    parts = [f"t={monday.isoformat()}", "lid=" + ",".join(str(n) for n in household)]
    for day_idx, day in enumerate(DAYS):
        value = days.get(day, [])
        if value == "off":
            parts.append(f"{day}=-")
            continue
        if not isinstance(value, list):
            problems.append(f"{day} must be a list of meals or \"off\"")
            continue
        seen = set()
        tokens = []
        for meal in sorted(value, key=lambda m: SLOTS.index(m.get("slot")) if m.get("slot") in SLOTS else 99):
            if meal.get("slot") in seen:
                problems.append(f"{day}: slot {meal.get('slot')} given twice")
            seen.add(meal.get("slot"))
            token = meal_token(meal, day, day_idx, household, problems)
            if token:
                tokens.append(token)
        parts.append(f"{day}=" + ",".join(tokens))

    return BASE + "?" + "&".join(parts), problems


def main():
    raw = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else sys.stdin.read()
    try:
        week = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Input is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)
    link, problems = build(week)
    if problems:
        print("Fix these and run again:", file=sys.stderr)
        for p in problems:
            print(f"- {p}", file=sys.stderr)
        sys.exit(1)
    print(link)


if __name__ == "__main__":
    main()
