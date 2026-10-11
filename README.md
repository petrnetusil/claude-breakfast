# Jídelníček

Týdenní plánovač jídla pro rodinu. Jídelníček sestavuje **Claude** v projektu „Jídelníček“
s konektorem **Rohlík**: vyhledá recepty na Rohlík Chef a pošle odkaz. Odkaz otevře tuto aplikaci,
kde jde jídelníček prohlédnout, upravit a udělat z něj nákupní seznam. Nákup do košíku zařídí
zase Claude přes konektor Rohlík.

Aplikace: https://petrnetusil.github.io/claude-breakfast/

- Nastavení pro uživatele: [docs/navod.md](docs/navod.md)
- Pokyny pro projekt v Claudovi: [docs/claude-projekt.md](docs/claude-projekt.md)

## Spuštění

```bash
npm install
npm run dev        # vývoj; adresu "Network" otevřete na telefonu ve stejné Wi-Fi
npm test           # testy odkazu, čtení dat z Rohlíku a nákupního seznamu
npm run build      # statický web do dist/
```

Po každém pushi do větve `master` (produkce) se aplikace sama nasadí na GitHub Pages
(workflow `.github/workflows/pages.yml`).

## Data

- V repozitáři nejsou žádná data z Rohlíku. Recepty, fotky, suroviny a postupy aplikace načítá
  živě z veřejných endpointů rohlik.cz (stejných, jaké používá web Rohlíku; povolují CORS).
- V zařízení zůstává jen aktuální týden (čísla receptů, porce, odškrtnutí), výchozí porce
  a oblíbená čísla receptů. Nic se necachuje.

## Co zatím ne

- **Synchronizace mezi telefonem a iPadem.** Stejný odkaz od Clauda jde otevřít všude,
  úpravy v aplikaci ale zůstávají v zařízení.
- **Košík přímo z aplikace.** Rohlík nepovoluje přihlášení z vlastní aplikace na github.io,
  košík proto plní Claude.
