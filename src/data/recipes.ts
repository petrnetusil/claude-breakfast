import type { Recipe, Slot, Tag } from '../lib/types';

/*
 * Seed recipes, taken from Rohlík Chef (rohlik.cz/chef) on 2026-10-06.
 *
 * - Titles, times, authors, photos and ingredient amounts are Rohlík's.
 * - Steps are shortened paraphrases and may be incomplete; the app links to the original.
 * - Rohlík mostly does not state the number of portions. Where `stated` is false,
 *   `base` is our estimate from the amounts. Replace with real data once the app
 *   reads recipes through the Rohlík MCP server.
 * - Ingredient names are normalised (lower case, one name per thing) so the shopping
 *   list can add them up. Water, baking paper and similar are left out.
 */

const IMG = 'https://cdn.rohlik.cz/images/meals/large/';

type I = [name: string, amount?: number | null, unit?: string | null];

function r(
  id: number,
  slug: string,
  title: string,
  slots: Slot[],
  tag: Tag,
  time: number,
  base: number,
  stated: boolean,
  img: string,
  author: string,
  ings: I[],
  steps: string[],
): Recipe {
  return {
    id,
    slug,
    title,
    slots,
    tag,
    time,
    baseServings: base,
    servingsStated: stated,
    image: IMG + img,
    imageLocal: 'recipes/' + img.replace(/\.\w+$/, '.jpg'),
    author,
    ingredients: ings.map(([name, amount, unit]) => ({ name, amount: amount ?? null, unit: unit ?? null })),
    steps,
  };
}

const S: I = ['sůl'];
const P: I = ['pepř'];

export const RECIPES: Recipe[] = [
  // ───────────── Snídaně ─────────────
  r(22143, '22143-ovesne-livance', 'Ovesné lívance', ['sn'], '', 15, 2, false,
    'recipe_22143_1775170427372_oatmeal-pancakes-with-fresh-berries_e728c845.png', 'Alpro',
    [['ovesné vločky', 45, 'g'], ['ovesný nápoj', 180, 'ml'], ['vejce', 1, 'ks'], ['hladká mouka', 60, 'g'], ['cukr krupice', 1, 'lžíce'], ['prášek do pečiva', 1.5, 'lžička'], ['vanilkový extrakt', 1, 'lžička'], ['rostlinný olej', 2, 'lžíce'], S, ['čerstvé ovoce']],
    ['Všechny suroviny rozmixujte na hladké těsto.', 'Pánev lehce potřete olejem a rozehřejte na středním plameni.', 'Těsto dávkujte na pánev a lívance opečte z obou stran. Podávejte s ovocem.']),
  r(155, '155-francouzsky-toust', 'Francouzský toust', ['sn'], '', 15, 2, false,
    'recipe_155_1778661229908_classic-french-toast-with-cinnamon-and-vanilla_72aa9fd8.jpg', 'Roman Vaněk',
    [['toustový chléb', 4, 'plátek'], ['mléko', 300, 'ml'], ['máslo', 50, 'g'], ['vejce', 2, 'ks'], ['vanilkový cukr', 10, 'g'], ['skořice mletá', 0.25, 'lžička'], ['vanilkové aroma', 1, 'lžička'], ['muškátový oříšek', null, 'špetka'], ['moučkový cukr']],
    ['V míse prošlehejte vejce s mlékem, muškátovým oříškem, skořicí, vanilkovým aroma a cukrem.', 'Na pánvi na středním ohni rozehřejte máslo.', 'Plátky chleba namočte ve směsi, aby nasákly, a na mírném ohni osmažte z obou stran dozlatova.']),
  r(13584, '13584-avokadovy-toast', 'Avokádový toast', ['sn'], '', 20, 2, false,
    'recipe_13584_1775146796832_avocado-toast-with-fried-egg-and-radishes_e9bad32b.png', 'Jíme zdravě',
    [['avokádo', 1, 'ks'], ['máta', 1, 'lžička'], ['ředkvičky', 50, 'g'], ['řapíkatý celer', 30, 'g'], ['jarní cibulka', 20, 'g'], ['celozrnný chléb', 2, 'plátek'], ['vejce', 2, 'ks'], S, P, ['řeřicha']],
    ['Avokádo oloupejte, vypeckujte a nakrájejte na kostičky. Ředkvičky nakrájejte na plátky, celer na kostičky.', 'Mátu nasekejte nahrubo, cibulku najemno. Vše smíchejte, osolte, opepřete a dejte vychladit.', 'Plátky chleba opečte na pánvi nebo v toustovači.', 'Na rozpálené pánvi připravte volská oka, asi 5 minut pod pokličkou, a podávejte je na toastech se směsí.']),
  r(38, '38-krupicova-kase', 'Krupicová kaše', ['sn'], '', 10, 1, false,
    'recipe_38_1787922819738_semolina-porridge_35ebdbcc.jpg', 'Roman Vaněk',
    [['mléko', 250, 'ml'], ['dětská krupice', 40, 'g'], ['máslo', 10, 'g'], ['cukr krupice', 12.5, 'g'], ['skořice mletá', 1, 'lžička'], ['sůl', null, 'špetka']],
    ['Do rendlíku nalijte mléko, přidejte sůl a krupici a za stálého míchání přiveďte k varu.', 'Za stálého míchání vařte 2 minuty a kaši nalijte na talíř.', 'Navrch položte kousky másla a posypte cukrem a skořicí.']),
  r(24736, '24736-toast-s-vajickovou-pomazankou', 'Toast s vajíčkovou pomazánkou', ['sn', 'sv'], '', 20, 2, false,
    'recipe_24736_1775177112637_whole-grain-toast-with-egg-salad-and-arugula_b4d0c330.png', 'Hana Pospíchalová',
    [['celozrnný toustový chléb', 2, 'plátek'], ['vejce', 4, 'ks'], ['lučina', 100, 'g'], ['majonéza', 20, 'g'], ['jarní cibulka', 1, 'ks'], ['rukola', 50, 'g'], ['hořčice', 1, 'lžíce'], S, P],
    ['Vejce uvařte natvrdo (8–10 minut), zchlaďte studenou vodou a oloupejte.', 'Vejce nakrájejte nadrobno, přidejte sýr, hořčici, nakrájenou cibulku, sůl a pepř a promíchejte.', 'Na plátek chleba položte rukolu a pomazánku a přiklopte druhým plátkem.']),
  r(20075, '20075-jogurtove-livance-s-boruvkami', 'Jogurtové lívance s borůvkami', ['sn'], '', 25, 4, false,
    'recipe_20075_1775169328649_yogurt-pancakes-with-blueberries_cc48dc16.png', 'Kateřina Jašková',
    [['smetanový jogurt', 150, 'g'], ['kefír', 100, 'g'], ['mléko', 100, 'ml'], ['vejce', 2, 'ks'], ['máslo', 20, 'g'], ['citron', 1, 'ks'], ['borůvky', 125, 'g'], ['hladká mouka', 200, 'g'], ['mletá vanilka', 1, 'lžička'], ['moučkový cukr', 40, 'g'], ['jedlá soda', 0.5, 'lžička'], ['prášek do pečiva', 0.5, 'lžička'], ['sůl', null, 'špetka']],
    ['Do mísy prosejte mouku, přidejte sůl, cukr, vanilku, prášek do pečiva a sodu a promíchejte.', 'Ve druhé míse metličkou spojte jogurt, kefír, mléko, rozpuštěné máslo a vejce.', 'Obě směsi spojte, přidejte citronovou kůru a borůvky a promíchejte.']),

  // ───────────── Svačiny ─────────────
  r(25240, '25240-tvarohova-pomazanka-s-pazitkou-rychla-a-zdrava-svacina', 'Tvarohová pomazánka s pažitkou', ['sv'], '', 10, 4, false,
    'recipe_25240_1782247492388_chive-quark-spread_8a38df56.jpg', 'Jíme zdravě',
    [['polotučný tvaroh', 200, 'g'], ['slunečnicová semínka', 60, 'g'], ['rýžová smetana', 60, 'ml'], ['česnek', 2, 'stroužek'], ['šalotka', 1, 'ks'], ['pažitka', 1, 'hrst'], S, P],
    ['Česnek prolisujte do misky.', 'Přidejte tvaroh, slunečnicová semínka, smetanu a nasekanou šalotku.', 'Vmíchejte nasekanou pažitku, důkladně promíchejte a dochuťte solí a pepřem.']),
  r(22107, '22107-zeleninove-hranolky-s-dipem', 'Zeleninové hranolky s dipem', ['sv'], '', 10, 2, false,
    'recipe_22107_1775170341406_vegetable-sticks-with-herb-cream-cheese-dip_09392f89.png', 'Rohlík vaří',
    [['okurka hadovka'], ['mrkev'], ['paprika'], ['lučina'], ['pažitka'], S, P],
    ['Zeleninu očistěte a nakrájejte na hranolky.', 'Lučinu smíchejte s nakrájenou pažitkou a dochuťte solí a pepřem.']),
  r(19786, '19786-tortillove-rolky-s-mrkvovou-pomazankou', 'Tortillové rolky s mrkvovou pomazánkou', ['sv'], '', 15, 2, false,
    'recipe_19786_1775169226852_tortilla-rolls-with-carrot-and-cream-cheese-spread_368139f2.png', 'Kateřina Jašková',
    [['mrkev', 150, 'g'], ['máslo', 10, 'g'], ['parmazán', 35, 'g'], ['žervé', 160, 'g'], ['okurka hadovka'], ['pšeničné tortilly', 2, 'ks'], ['citronová šťáva'], S],
    ['Na pánvi rozehřejte máslo a orestujte na něm nastrouhanou mrkev.', 'Vychladlou mrkev smíchejte s parmazánem a žervé.', 'Osolte, zakápněte citronovou šťávou a promíchejte. Směsí potřete tortilly a zarolujte je.']),
  r(24847, '24847-okurkove-sendvice', 'Okurkové sendviče', ['sv'], '', 15, 4, false,
    '24847-1739368919650.jpg', 'Jíme zdravě',
    [['pažitka', 5, 'g'], ['máta'], ['bazalka', 5, 'g'], ['okurka hadovka', 200, 'g'], ['kozí sýr', 100, 'g'], ['polotučný tvaroh', 100, 'g'], ['celozrnný toustový chléb', 8, 'plátek'], S, P],
    ['Bylinky nasekejte najemno, okurku oloupejte a nakrájejte na tenká kolečka.', 'V misce smíchejte kozí sýr, tvaroh, bylinky, sůl a pepř.', 'Chléb potřete pomazánkou, poklaďte okurkou a přiklopte druhým plátkem.', 'Sendviče šikmo rozkrojte a podávejte.']),
  r(949, '949-domaci-termix', 'Domácí termix', ['sv', 'de'], '', 15, 4, false,
    'recipe_949_1775144053099_homemade-chocolate-curd-dessert_394a92de.png', 'Kuchařka pro dceru',
    [['smetana ke šlehání', 200, 'ml'], ['hořká čokoláda', 100, 'g'], ['měkký tvaroh', 250, 'g'], ['moučkový cukr']],
    ['Smetanu přiveďte téměř k varu, odstavte a vsypte nalámanou čokoládu.', 'Míchejte metličkou, dokud se čokoláda nerozpustí na hladký krém.', 'Do krému vmíchejte tvaroh, promíchejte dohladka a podle chuti doslaďte.']),
  r(1029, '1029-ovocny-salat', 'Ovocný salát', ['sv', 'de'], '', 15, 4, true,
    'recipe_1029_1775144289534_fresh-seasonal-fruit-salad-with-honey-and-walnuts_d485ec7a.png', 'Kuchařka pro dceru',
    [['sezónní ovoce', 8, 'ks'], ['citronová šťáva'], ['med'], ['vlašské ořechy', 50, 'g']],
    ['Na osobu počítejte 2 kusy ovoce. Oloupejte je a nakrájejte na sousta.', 'Zakápněte citronovou šťávou a medem podle chuti.', 'Posypte ořechy.']),

  // ───────────── Polévky ─────────────
  r(22890, '22890-kureci-vyvar-s-nudlemi', 'Kuřecí vývar s nudlemi', ['po'], 'kure', 140, 6, false,
    'recipe_22890_1787919365753_chicken-noodle-soup_7b3744c5.jpg', '30 minut v kuchyni',
    [['mrkev', 250, 'g'], ['celer bulvový', 200, 'g'], ['petržel kořenová', 150, 'g'], ['cibule', 80, 'g'], ['kuřecí skelet', 1, 'ks'], ['libeček'], ['vaječné nudle', 40, 'g'], ['petrželová nať'], ['nové koření', 5, 'ks'], ['bobkový list', 2, 'ks'], S, P],
    ['Troubu předehřejte na 230 °C. Zeleninu oloupejte, slupky si nechte.', 'Skelet se zeleninou pečte 20–25 minut a přendejte do hrnce i se slupkami.', 'Zalijte 2 l studené vody, přidejte koření, bobkový list, libeček, sůl a pepř.', 'Vařte 1,5–2 hodiny na mírném plameni a sbírejte pěnu.', 'Nudle uvařte zvlášť v osolené vodě (5–6 minut) a sceďte.']),
  r(395, '395-dynova-polevka', 'Dýňová polévka', ['po'], 'bezmasa', 50, 4, false,
    'recipe_395_1787922418627_pumpkin-soup_a37e4924.jpg', 'Roman Vaněk',
    [['máslová dýně', 500, 'g'], ['cibule', 80, 'g'], ['zázvor', 20, 'g'], ['pomerančový džus', 130, 'ml'], ['smetana ke šlehání', 50, 'ml'], ['pažitka', 1, 'lžíce'], ['dýňový olej', 5, 'lžička'], ['olivový olej', 50, 'ml'], ['cukr krupice', 50, 'g'], ['citronová šťáva', 1, 'lžíce'], S],
    ['Cibuli nakrájejte najemno, zázvor na plátky, dýni na 2cm kostky.', 'Na oleji zpěňte cibuli, orestujte zázvor a s cukrem nechte zezlátnout.', 'Přidejte dýni, minutu míchejte, přilijte džus a nechte téměř vyvařit.', 'Dolijte vodu, vařte doměkka a rozmixujte. Dochuťte solí a citronem.', 'Podávejte se smetanou a pažitkou.']),
  r(23841, '23841-hraskova-polevka', 'Hrášková polévka', ['po'], 'bezmasa', 25, 4, false,
    'recipe_23841_1775171762042_creamy-green-pea-soup-with-lemon_473202e9.png', 'Jíme zdravě',
    [['cibule', 1, 'ks'], ['česnek', 2, 'stroužek'], ['řepkový olej', 1, 'lžíce'], ['mražený hrášek', 350, 'g'], ['zeleninový vývar', 700, 'ml'], ['citronová šťáva', 1, 'lžíce'], S],
    ['Cibuli a česnek nakrájejte najemno. V hrnci rozpalte olej a cibuli 4 minuty restujte.', 'Přidejte česnek, minutu restujte, vsypte hrášek, zalijte vývarem a vařte 15 minut.', 'Polévku rozmixujte dohladka a dochuťte solí a citronovou šťávou.']),
  r(22176, '22176-rajcatova-polevka-s-bazalkou', 'Rajčatová polévka s bazalkou', ['po'], 'bezmasa', 35, 4, false,
    'recipe_22176_1775170510185_rustic-italian-tomato-and-basil-soup-with-sourdough-baguette_434c9c32.png', 'Green Leaves',
    [['šalotka', 2, 'ks'], ['česnek', 1, 'ks'], ['bazalka', 1, 'hrst'], ['veganský parmazán', 50, 'g'], ['světlé pečivo', 6, 'plátek'], ['rajčata', 2000, 'g'], ['olivový olej', 5, 'lžíce'], ['třtinový cukr'], S],
    ['Rajčata nařízněte do kříže, na 5 minut zalijte horkou vodou a oloupejte.', 'Rajčata rozčtvrťte, zbavte semínek a rozmixujte.', 'Šalotku a česnek oloupejte a nakrájejte nadrobno.']),

  // ───────────── Hlavní jídla ─────────────
  r(24094, '24094-medovocesnekove-kure', 'Medovočesnekové kuře', ['ve', 'ob'], 'kure', 30, 2, false,
    'recipe_24094_1775172145834_honey-garlic-chicken-with-rice_c66728a2.png', '30 minut v kuchyni',
    [['kuřecí prsa', 2, 'ks'], ['kukuřičný škrob', 1.5, 'lžíce'], ['řepkový olej', 2, 'lžíce'], ['petrželová nať', 2, 'lžíce'], ['sójová omáčka', 2, 'lžíce'], ['česnek', 6, 'stroužek'], ['med', 3, 'lžíce'], ['citron', 0.5, 'ks'], S, ['rýže']],
    ['Kuřecí prsa nakrájejte na kousky asi 2 × 2 cm.', 'Maso dejte do krabičky se škrobem a solí, zavřete a protřepejte.', 'V hrnku smíchejte med, sójovou omáčku, 50 ml vody, citronovou šťávu, sůl a prolisovaný česnek.', 'Maso opečte, zalijte omáčkou a podávejte s rýží.']),
  r(107, '107-quesadillas-s-kurecim-masem', 'Quesadillas s kuřecím masem', ['ve'], 'kure', 25, 4, false,
    'recipe_107_1787919997877_chicken-quesadillas_4a2e29d8.jpg', 'Roman Vaněk',
    [['kuřecí stehenní řízky', 380, 'g'], ['slanina', 70, 'g'], ['kukuřičné tortilly', 4, 'ks'], ['plátkový cheddar', 4, 'ks'], ['rajčata', 300, 'g'], ['červená paprika', 100, 'g'], ['koriandr čerstvý', 4, 'lžíce'], ['papričky jalapeño', 4, 'ks'], ['zakysaná smetana', 4, 'lžíce'], ['guacamole', 4, 'lžíce'], ['olivový olej', 2, 'lžíce'], S],
    ['Maso osolte, ogrilujte z obou stran doměkka, nechte 3 minuty odpočinout a nakrájejte na plátky.', 'Rajčata nakrájejte na plátky, jalapeño na kolečka, papriku na nudličky. Slaninu ogrilujte dozlatova.', 'Na polovinu tortilly naskládejte náplň a sýr, přehněte a opečte.']),
  r(24371, '24371-kure-na-kari-s-ryzi', 'Kuře na kari s rýží', ['ve', 'ob'], 'kure', 45, 4, false,
    'recipe_24371_1775386526691_creamy-chicken-curry-with-jasmine-rice_3272ace7.png', '30 minut v kuchyni',
    [['jasmínová rýže', 150, 'g'], ['kuřecí prsa', 600, 'g'], ['cibule', 200, 'g'], ['česnek', 21, 'g'], ['chilli vločky', 5, 'g'], ['smetana na vaření', 200, 'ml'], ['kuřecí vývar', 250, 'ml'], ['slunečnicový olej', 30, 'ml'], ['kari koření', 15, 'g']],
    ['Rýži propláchněte, zalijte 300 ml vody a vařte 15–20 minut doměkka.', 'Kuřecí prsa nakrájejte na nudličky, cibuli a česnek najemno.', 'Na rozpáleném oleji maso 3–4 minuty zprudka opékejte za stálého míchání.']),
  r(17814, '17814-kureci-casserole-s-brokolici-a-ryzi', 'Kuřecí casserole s brokolicí a rýží', ['ve'], 'kure', 45, 4, false,
    'recipe_17814_1775168648176_chicken-broccoli-and-rice-casserole_ceb930b8.png', 'Jíme zdravě',
    [['kuřecí prsa', 600, 'g'], ['cibule', 2, 'ks'], ['rýže', 700, 'g'], ['sušená rajčata', 120, 'g'], ['brokolice', 1, 'ks'], ['čedar', 200, 'g'], ['petrželová nať', 2, 'hrst'], ['olivový olej', 1, 'lžíce'], ['paprika sladká mletá', 1, 'lžička'], S, P],
    ['Troubu předehřejte na 200 °C a připravte formu asi 40 × 25 cm.', 'Do formy dejte maso a cibuli, zakápněte olejem a ochuťte paprikou, solí a pepřem.', 'Promíchejte a pečte 10 minut.', 'Přidejte rýži a sušená rajčata a promíchejte s masem.', 'Navrch rozložte brokolici, vtlačte ji do rýže a zasypte čedarem.', 'Pečte 15–20 minut při 180 °C.']),
  r(23851, '23851-smetanove-testoviny-s-lososem-a-hraskem', 'Smetanové těstoviny s lososem a hráškem', ['ve'], 'ryba', 35, 2, false,
    'recipe_23851_1775171876681_creamy-salmon-and-pea-spaghetti_fe9fcbfb.png', 'Jíme zdravě',
    [['filet z lososa', 250, 'g'], ['cibule', 80, 'g'], ['špagety', 200, 'g'], ['smetana na vaření', 150, 'ml'], ['smetanový sýr', 50, 'g'], ['mražený hrášek', 200, 'g'], ['petrželová nať', 1, 'lžíce'], ['olivový olej', 2, 'lžíce'], S, P],
    ['Postavte vodu na těstoviny. Lososa zbavte kůže a nakrájejte na kostičky, cibuli najemno.', 'Těstoviny uvařte podle návodu a sceďte.', 'Na oleji 4–5 minut restujte cibuli, přidejte lososa, osolte, opepřete a 2–3 minuty restujte.', 'Přidejte hrášek, smetanu, sýr a 50 ml vody a vařte, dokud omáčka nezhoustne.', 'Těstoviny smíchejte s omáčkou, dochuťte a posypte petrželkou.']),
  r(20074, '20074-peceny-losos-a-noky-s-chrestem-a-syrovou-omackou', 'Pečený losos a noky s chřestem a sýrovou omáčkou', ['ve'], 'ryba', 40, 4, false,
    'recipe_20074_1787921522841_baked-salmon-with-gnocchi-and-asparagus-in-cheese-sauce_a2b77950.jpg', 'Kateřina Jašková',
    [['filet z lososa', 400, 'g'], ['máslo', 50, 'g'], ['zelený chřest', 8, 'ks'], ['bramborové gnocchi', 500, 'g'], ['smetana na vaření', 400, 'ml'], ['parmazán'], S],
    ['Troubu rozehřejte na 180 °C.', 'Lososa omyjte, osušte a osolte.', 'Filety položte na plech s pečicím papírem, přidejte máslo a pečte 20 minut.']),
  r(23855, '23855-zapecene-celozrnne-testoviny-s-tunakem', 'Zapečené celozrnné těstoviny s tuňákem', ['ve'], 'ryba', 50, 2, false,
    'recipe_23855_1775171884881_baked-whole-grain-penne-with-tuna-and-vegetables_af8af73b.png', 'Jíme zdravě',
    [['celozrnné penne', 150, 'g'], ['červená paprika', 100, 'g'], ['cibule', 100, 'g'], ['česnek', 1, 'stroužek'], ['tuňák v konzervě', 180, 'g'], ['mražený hrášek', 100, 'g'], ['jarní cibulka', 30, 'g'], ['mléko', 100, 'ml'], ['řepkový olej', 1, 'lžíce'], ['sušené oregano', 1, 'lžička'], S],
    ['Těstoviny uvařte v osolené vodě (16–17 minut) a sceďte.', 'Troubu předehřejte na 200 °C. Papriku zbavte jader a nakrájejte.', 'Na oleji 4–5 minut restujte cibuli, papriku a česnek.', 'Přidejte tuňáka, hrášek a oregano a 3–4 minuty restujte.', 'Přidejte jarní cibulku a mléko, 2–3 minuty provařte a zapečte s těstovinami.']),
  r(14613, '14613-salmon-with-potatoes', 'Losos s bramborami', ['ve'], 'ryba', 25, 2, false,
    'recipe_14613_1775167377393_pan-seared-salmon-with-boiled-potatoes-and-fresh-salad_c76337d3.png', 'Eat Your Fears',
    [['filet z lososa', 300, 'g'], ['ghí', 10, 'g'], ['brambory', 250, 'g'], ['cherry rajčata', 100, 'g'], ['mix salátů', 60, 'g'], ['olivový olej', 10, 'ml'], ['citron'], ['jarní cibulka'], S],
    ['Na pánvi rozehřejte ghí. Lososa osolte, krátce opečte z obou stran, přiklopte a nechte dojít.', 'Brambory uvařte doměkka. Saláty a cherry rajčata promíchejte s olivovým olejem.', 'Lososa pokapejte citronovou šťávou, brambory posypte jarní cibulkou a podávejte.']),
  r(60, '60-testoviny-s-bolonskym-ragu', 'Těstoviny s boloňským ragú', ['ve', 'ob'], 'hovezi', 210, 8, false,
    '60-1625329609579.jpg', 'Roman Vaněk',
    [['mletý vepřový bůček', 400, 'g'], ['mleté hovězí', 400, 'g'], ['rajský protlak', 150, 'g'], ['červené víno', 300, 'ml'], ['cibule', 200, 'g'], ['česnek', 3, 'stroužek'], ['mrkev', 300, 'g'], ['celer bulvový', 200, 'g'], ['řapíkatý celer', 100, 'g'], ['slanina', 100, 'g'], ['tagliatelle'], ['parmazán'], ['olivový olej', 100, 'ml'], ['muškátový oříšek', 1, 'lžička'], ['bobkový list', 2, 'ks'], ['nové koření', 5, 'ks'], P, S],
    ['Bobkový list, pepř a nové koření zavažte do sáčku.', 'Cibuli a česnek nakrájejte najemno, mrkev a celer na půlcentimetrové kostičky.', 'Řapíkatý celer podélně rozkrojte a nakrájejte na kousky.', 'Ragú duste pomalu na velmi mírném ohni, aby maso změklo.']),
  r(22603, '22603-hovezi-stir-fry-s-brokolici', 'Hovězí stir-fry s brokolicí', ['ve'], 'hovezi', 20, 2, false,
    'recipe_22603_1775170839781_beef-and-broccoli-stir-fry-with-rice_29b5edbb.png', 'Lee Kum Kee',
    [['rostlinný olej', 1, 'lžíce'], ['hovězí svíčková nebo kýta', 225, 'g'], ['mrkev', 1, 'ks'], ['brokolice', 125, 'g'], ['červená paprika', 0.5, 'ks'], ['stir-fry omáčka', 50, 'g'], ['rýže']],
    ['Ve woku nebo velké pánvi rozpalte olej a 2 minuty restujte maso nakrájené na plátky.', 'Přidejte nakrájenou zeleninu a 3–4 minuty restujte za stálého míchání.', 'Vlijte omáčku, podlijte trochou vody a 2 minuty prohřejte. Podávejte s rýží.']),
  r(1619, '1619-hovezi-stroganoff', 'Hovězí Stroganoff', ['ve'], 'hovezi', 40, 2, false,
    'recipe_1619_1775145164799_beef-stroganoff-with-mushrooms-and-sour-cream_85d7cdee.png', 'Kuchařka pro dceru',
    [['nízký roštěnec', 300, 'g'], ['žampiony', 100, 'g'], ['cibule', 1, 'ks'], ['citron', 0.5, 'ks'], ['zakysaná smetana', 0.5, 'ks'], ['máslo', 1, 'lžíce'], P, S],
    ['Maso nakrájejte na nudličky a promíchejte se solí a pepřem.', 'Cibuli nakrájejte na půlměsíčky. Žampiony očistěte, nakrájejte a namočte do vody s citronem.', 'Na másle opečte okapané žampiony, nechte odpařit šťávu, přidejte cibuli, opečte dohněda a dejte stranou.']),
  r(25162, '25162-hovezi-gulas-poctiva-ceska-klasika', 'Hovězí guláš', ['ve', 'ob'], 'hovezi', 110, 4, false,
    'recipe_25162_1782242588929_beef-goulash_20b5685d.jpg', 'Jíme zdravě',
    [['hovězí kližka', 400, 'g'], ['cibule', 2, 'ks'], ['přepuštěné máslo', 1, 'lžíce'], ['rajský protlak', 2, 'lžíce'], ['hovězí vývar', 700, 'ml'], ['česnek', 2, 'stroužek'], ['řepkový olej', 1, 'lžíce'], ['paprika sladká mletá', 1, 'lžíce'], ['sušená majoránka', 2, 'lžička'], S, P],
    ['Maso nakrájejte na kostky. V hrnci rozehřejte olej a máslo.', 'Maso restujte na středním plameni asi 5 minut dozlatova.', 'Přidejte nasekanou cibuli a 3–4 minuty ji zprudka opékejte.']),
  r(24189, '24189-brokolicova-omacka-s-testovinami', 'Brokolicová omáčka s těstovinami', ['ve', 'ob'], 'bezmasa', 30, 2, false,
    'recipe_24189_1775172235450_creamy-broccoli-pasta-with-parmesan-and-gouda_048193c8.png', '30 minut v kuchyni',
    [['brokolice', 200, 'g'], ['těstoviny', 150, 'g'], ['cibule', 1, 'ks'], ['česnek', 4, 'stroužek'], ['máslo', 1, 'lžíce'], ['parmazán', 40, 'g'], ['gouda', 40, 'g'], ['řepkový olej', 1, 'lžíce'], ['hladká mouka', 30, 'g'], S, P],
    ['Postavte vodu na těstoviny. Brokolici nakrájejte na malé kousky, cibuli a česnek nasekejte.', 'Těstoviny vařte 6–8 minut i s brokolicí, sceďte a 400 ml vody si nechte.', 'Na oleji 3–4 minuty opékejte cibuli na mírném plameni.', 'Přidejte máslo a mouku, udělejte jíšku a vmíchejte sýry a vodu z těstovin.', 'Vařte a míchejte, dokud nevznikne hladká krémová omáčka.', 'Vmíchejte těstoviny s brokolicí a dochuťte solí a pepřem.']),
  r(407, '407-zeleninove-kari', 'Zeleninové kari', ['ve', 'ob'], 'bezmasa', 45, 4, true,
    'recipe_407_1787922185958_vegetable-curry_c312d89c.jpg', 'Roman Vaněk',
    [['kokosové mléko', 500, 'ml'], ['květák', 60, 'g'], ['brokolice', 60, 'g'], ['červená cibule', 60, 'g'], ['řapíkatý celer', 60, 'g'], ['celer bulvový', 60, 'g'], ['mrkev', 60, 'g'], ['zelená paprika', 60, 'g'], ['červená paprika', 60, 'g'], ['žlutá paprika', 60, 'g'], ['rajčata', 60, 'g'], ['zázvor', 10, 'g'], ['česnek', 5, 'g'], ['chilli paprička', 15, 'g'], ['máslo', 50, 'g'], ['koriandr čerstvý', 3, 'lžíce'], ['kardamom mletý', 1, 'lžička'], ['cibule', 60, 'g'], ['rostlinný olej', 50, 'ml'], ['skořice mletá', 1, 'lžička'], ['kari koření', 1, 'lžička'], ['koriandr mletý', 0.5, 'lžička'], ['hřebíček mletý', 1, 'lžička'], S],
    ['Smíchejte kari, sůl, kardamom, hřebíček, koriandr a skořici.', 'Kokosové mléko smíchejte s vodou.', 'Květák a brokolici rozdělte na růžičky, cibuli nakrájejte.']),
  r(411, '411-fazolove-chilli', 'Fazolové chilli', ['ve', 'ob'], 'bezmasa', 30, 4, false,
    'recipe_411_1778663967548_vegetarian-bean-chilli-with-corn-and-peppers_5404b35b.jpg', 'Roman Vaněk',
    [['červené fazole v konzervě', 250, 'g'], ['bílé fazole v konzervě', 250, 'g'], ['kukuřice v konzervě', 180, 'g'], ['drcená rajčata', 350, 'g'], ['zelená paprika', 170, 'g'], ['červená cibule', 130, 'g'], ['česnek', 20, 'g'], ['chilli paprička', 20, 'g'], ['cukr krupice', 10, 'g'], ['červené víno', 200, 'ml'], ['olivový olej', 3, 'lžíce'], ['červený vinný ocet', 1, 'lžíce'], ['sušené oregano', 1, 'lžíce'], ['rajský protlak', 1, 'lžíce'], ['skořice celá', 1, 'ks'], ['kajenský pepř', null, 'špetka'], ['paprika sladká mletá', 1, 'lžička'], ['římský kmín', 1, 'lžička'], P, S],
    ['Papriku nakrájejte na kostky, cibuli a česnek nadrobno, chilli na plátky.', 'Na oleji 3 minuty restujte papriku, cibuli a chilli.', 'Přidejte kajenský pepř, sladkou papriku a skořici a 2 minuty restujte.', 'Přidejte protlak, po minutě kmín a oregano.', 'Vmíchejte česnek, zalijte vínem a 2 minuty povařte.', 'Přidejte fazole, kukuřici a drcená rajčata a provařte.', 'Dochuťte cukrem, octem, solí a pepřem.']),
  r(1892, '1892-makarony-se-syrem-z-jednoho-hrnce', 'Makarony se sýrem z jednoho hrnce', ['ve'], 'bezmasa', 20, 4, false,
    'recipe_1892_1775145640915_one-pot-creamy-macaroni-and-cheese-with-cheddar_31d6acef.png', 'Rohlík vaří',
    [['cheddar', 300, 'g'], ['mléko', 1000, 'ml'], S, P, ['paprika sladká mletá', 1, 'lžička'], ['makarony', 350, 'g']],
    ['Cheddar nastrouhejte nahrubo.', 'Mléko přiveďte na středním plameni k varu.', 'Vsypte těstoviny, osolte, opepřete, přidejte papriku a promíchejte.', 'Vařte na mírném plameni 10–15 minut a často míchejte.', 'Až jsou těstoviny měkké a mléko skoro vstřebané, sundejte hrnec z plotny.', 'Vmíchejte sýr, nechte rozpustit a hned podávejte.']),
  r(71, '71-sunkofleky', 'Šunkofleky', ['ve', 'ob'], 'veprove', 55, 6, false,
    'recipe_71_1787915731778_czech-baked-pasta-with-smoked-meat_bcc14433.jpg', 'Roman Vaněk',
    [['uzená krkovice', 500, 'g'], ['vepřové sádlo', 1, 'lžíce'], ['strouhanka', 1, 'hrst'], ['česnek', 2, 'stroužek'], ['vejce', 6, 'ks'], ['smetana ke šlehání', 200, 'ml'], ['mléko', 100, 'ml'], ['petrželová nať', 1, 'hrst'], ['fleky', 500, 'g'], S, P],
    ['Troubu rozehřejte na 170 °C. Pekáč vymažte sádlem a vysypte strouhankou.', 'Česnek prolisujte, vejce rozmíchejte se smetanou a mlékem, maso nakrájejte na kostky.', 'Fleky uvařte napůl, sceďte a smíchejte s masem, petrželkou, česnekem, solí a pepřem.', 'Zalijte vejci se smetanou, promíchejte a zapečte.']),

  // ───────────── Obědy do práce ─────────────
  r(24237, '24237-testovinovy-salat-s-kurecim-masem', 'Těstovinový salát s kuřecím masem', ['ob'], 'kure', 35, 4, false,
    'recipe_24237_1775172630826_whole-grain-pasta-salad-with-roasted-chicken-and-baby-spinac_6194aeda.png', 'Jíme zdravě',
    [['celozrnné těstoviny', 250, 'g'], ['kuřecí prsa', 300, 'g'], ['bílý jogurt', 150, 'g'], ['červená paprika', 1, 'ks'], ['cherry rajčata', 100, 'g'], ['baby špenát', 150, 'g'], ['slunečnicový olej', 2, 'lžíce'], ['citronová šťáva', 2, 'lžíce'], S, P],
    ['Těstoviny uvařte na skus (12–15 minut), sceďte a propláchněte studenou vodou.', 'Kuřecí prsa nakrájejte na kostičky, osolte a 8–10 minut opékejte na oleji dozlatova.', 'Nakrájejte papriku a rajčata a vše smíchejte se špenátem a jogurtem. Dochuťte.', 'Podávejte vychlazené.']),
  r(24245, '24245-cockovy-salat', 'Čočkový salát', ['ob'], 'bezmasa', 30, 2, false,
    'recipe_24245_1775172679337_fresh-lentil-salad-with-carrots-and-pickles_75adfdf7.png', 'Jíme zdravě',
    [['hnědá čočka', 100, 'g'], ['mrkev', 1, 'ks'], ['cibule', 1, 'ks'], ['nakládané okurky', 3, 'ks'], ['petrželová nať', 1, 'hrst'], ['citron', 1, 'ks'], S, P],
    ['Čočku zalijte 300 ml vody, přiveďte k varu, osolte a vařte 13–15 minut.', 'Mrkev oloupejte a nakrájejte na kousky, cibuli a okurky najemno.', 'Petrželku nasekejte najemno.', 'V míse smíchejte zeleninu s vychladlou čočkou.', 'Dochuťte citronovou šťávou, solí a pepřem.']),
  r(17167, '17167-rychly-cizrnovy-salat', 'Rychlý cizrnový salát', ['ob'], 'bezmasa', 15, 4, false,
    'recipe_17167_1775168367348_quick-chickpea-salad-with-ricotta-and-feta_825b4a44.png', 'Jíme zdravě',
    [['cizrna v konzervě', 500, 'g'], ['feta', 100, 'g'], ['šalotka', 1, 'ks'], ['ricotta', 300, 'g'], ['petrželová nať', 1, 'hrst'], ['lahůdkové droždí', 1, 'lžíce'], S, P],
    ['Cizrnu sceďte. Šalotku a fetu nastrouhejte a přidejte k cizrně.', 'Přidejte nasekanou petrželku, ricottu, droždí, sůl a pepř a promíchejte.', 'Nechte chvíli odležet v lednici.']),
  r(10864, '10864-testovinovy-salat-s-tunakem-kukurici-a-hraskem', 'Těstovinový salát s tuňákem, kukuřicí a hráškem', ['ob'], 'ryba', 22, 4, false,
    'recipe_10864_1775146204241_tuna-pasta-salad-with-corn-and-peas_854548f6.png', 'Jíme zdravě',
    [['tuňák v konzervě', 160, 'g'], ['celozrnné těstoviny', 250, 'g'], ['mražený hrášek', 100, 'g'], ['bílý jogurt', 150, 'g'], ['jarní cibulka', 70, 'g'], ['kukuřice v konzervě', 100, 'g'], ['citronová šťáva', 2, 'lžíce'], S, P, ['pažitka']],
    ['Těstoviny uvařte podle návodu, mezitím nechte povolit hrášek a sceďte tuňáka.', 'Těstoviny sceďte, zchlaďte studenou vodou a nechte okapat.', 'Přidejte cibulku, tuňáka, kukuřici, hrášek, jogurt a citronovou šťávu, osolte a opepřete.', 'Promíchejte a podávejte posypané pažitkou.']),

  // ───────────── Dezerty ─────────────
  r(13612, '13612-banana-bread', 'Banana bread', ['de'], '', 60, 10, false,
    'recipe_13612_1775146849113_spelt-banana-bread-with-cinnamon-and-honey_6d796a42.png', 'Jíme zdravě',
    [['banán', 2, 'ks'], ['celozrnná špaldová mouka', 400, 'g'], ['kokosový olej', 60, 'g'], ['med', 70, 'g'], ['vejce', 2, 'ks'], ['skořice mletá', 1, 'lžička'], ['mléko', 190, 'ml'], ['prášek do pečiva', 2, 'lžička'], ['sůl', null, 'špetka']],
    ['Troubu předehřejte na 175 °C. Banány rozmačkejte a vyšlehejte s kokosovým olejem, medem a vejci.', 'Vmíchejte mouku, skořici, mléko, prášek do pečiva a sůl.', 'Těsto nalijte do formy, ozdobte půlkami banánu a pečte 40–45 minut.']),
  r(11, '11-babovka-s-orechy', 'Bábovka s ořechy', ['de'], '', 60, 12, false,
    '11.jpg', 'Roman Vaněk',
    [['polohrubá mouka', 350, 'g'], ['máslo', 250, 'g'], ['vejce', 6, 'ks'], ['cukr krupice', 300, 'g'], ['mléko', 200, 'ml'], ['vlašské ořechy', 150, 'g'], ['kakao', 50, 'g'], ['moučkový cukr'], ['hrubá mouka']],
    ['Troubu rozehřejte na 160 °C. Formu vymažte máslem a vysypte hrubou moukou.', 'Máslo rozpusťte. Z bílků ušlehejte sníh, žloutky vyšlehejte s cukrem do pěny.', 'Přidejte mléko, máslo, mouku, nasekané ořechy a kakao a opatrně vmíchejte sníh.', 'Těsto nalijte do formy, pečte 35–40 minut a hned vyklopte.', 'Vychladlou bábovku posypte moučkovým cukrem.']),
  r(393, '393-zemlovka', 'Žemlovka s jablky a tvarohem', ['de'], '', 60, 6, false,
    'recipe_393_1787920012218_czech-apple-bread-pudding-zemlovka_a29ec177.jpg', 'Roman Vaněk',
    [['měkký tvaroh', 250, 'g'], ['máslo', 120, 'g'], ['vejce', 4, 'ks'], ['rozinky', 50, 'g'], ['veka', 1, 'ks'], ['jablka', 500, 'g'], ['mléko', 750, 'ml'], ['vanilkový cukr', 30, 'g'], ['cukr krupice', 300, 'g'], ['skořice mletá', 1, 'lžička']],
    ['Troubu rozehřejte na 160 °C, pekáč vymažte máslem. Veku nakrájejte na centimetrové plátky.', 'Vejce rozdělte na žloutky a bílky, máslo rozpusťte.', 'Mléko prošlehejte se žloutky, cukrem a máslem a namočte v něm veku.', 'Tvaroh smíchejte s máslem, žloutkem, vanilkovým cukrem a rozinkami.', 'Z bílků ušlehejte sníh, vše navrstvěte do pekáče a upečte.']),
  r(45, '45-palacinky', 'Palačinky', ['de', 'sn'], '', 30, 4, false,
    'recipe_45_1787920286391_rolled-crepes-with-jam_23903463.jpg', 'Roman Vaněk',
    [['hladká mouka', 200, 'g'], ['mléko', 400, 'ml'], ['vejce', 2, 'ks'], ['máslo', 1, 'lžíce'], ['marmeláda'], ['moučkový cukr'], ['rostlinný olej'], ['sůl', null, 'špetka']],
    ['Vejce prošlehejte s mlékem, rozpuštěným máslem a solí a postupně zašlehejte mouku. Nechte hodinu odpočinout.', 'Pánev vytřete olejem, na mírném ohni nalijte těsto a krouživým pohybem ho rozlijte.', 'Palačinky osmažte z obou stran dozlatova, potřete marmeládou, zarolujte a pocukrujte.']),
];

const BY_ID = new Map(RECIPES.map((x) => [x.id, x]));

export function getRecipe(id: number | null | undefined): Recipe | undefined {
  return id == null ? undefined : BY_ID.get(id);
}

export function rohlikUrl(recipe: Recipe): string {
  return `https://www.rohlik.cz/chef/${recipe.slug}`;
}
