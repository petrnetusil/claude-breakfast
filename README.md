# Jídelníček

Týdenní plánovač jídla pro rodinu. Navrhne vyvážený týden z receptů Rohlík Chef, každé jídlo jde
vyměnit, vypnout nebo přepočítat na jiný počet porcí. Po schválení vznikne nákupní seznam.

## Spuštění

```bash
npm install
npm run dev        # vývoj; adresu "Network" otevřete na telefonu ve stejné Wi-Fi
npm test           # testy plánovače a nákupního seznamu
npm run build      # statický web do dist/ (jde nahrát na jakýkoli hosting)
```

Po každém pushi do větve `master` (produkce) se aplikace sama nasadí na GitHub Pages:
https://petrnetusil.github.io/claude-breakfast/ (workflow `.github/workflows/pages.yml`).

## Co funguje

- Úvodní obrazovka a nastavení počtu lidí (snídaně, svačina, oběd, večeře)
- Návrh týdne: rotace snídaní a svačin, obědy do práce (čerstvé nebo zbytek z večeře),
  večeře do 60 minut ve všední dny, o víkendu polévka + hlavní jídlo + dezert
- Vyváženost: aspoň 1× ryba, aspoň 2× bez masa, nejvýš 3× kuře a 2× hovězí, dvě večeře po sobě
  nikdy se stejným masem
- Výměna kteréhokoli jídla: tři návrhy, další tři, filtry, hledání podle názvu i suroviny
- „Nevaříme“ pro jídlo i celý víkendový den
- Detail receptu s přepočtem surovin a odkazem na Rohlík
- Oblíbená jídla (dostávají přednost) a historie schválených týdnů
- Schválení týdne a nákupní seznam sečtený přes recepty, základní suroviny odškrtnuté
- Ukládání v prohlížeči (localStorage), po znovuotevření je vše na místě

## Co zatím ne

- **Košík na Rohlíku.** Seznam jde zkopírovat a u položky otevřít hledání na Rohlíku.
- **Synchronizace mezi telefonem a iPadem.** Data jsou v každém zařízení zvlášť.
- **Živé recepty.** 40 receptů je uložených v `src/data/recipes.ts` (staženo 6. 10. 2026).
- **Angličtina.**

## Data z Rohlíku: co je ověřené

Recepty pocházejí ze stránek rohlik.cz/chef. Názvy, časy, autoři, suroviny a adresy fotek jsou
převzaté. Postupy jsou zkrácené vlastními slovy a mohou být neúplné. Počet porcí Rohlík na
stránce většinou neuvádí, u 38 ze 40 receptů je to odhad (`servingsStated: false`).
Adresy fotek nebyly ověřené načtením; když se fotka nenačte, zobrazí se kreslený talíř.
