import { useEffect, useLayoutEffect, useState } from 'react';
import { parseWeekLink } from './lib/link';
import { useRoute } from './lib/router';
import { currentEntry, recordRoute } from './lib/history';
import { onRouteChange } from './lib/scroll';
import { actions, useStore } from './lib/store';
import { Favorites } from './screens/Favorites';
import { Planner } from './screens/Planner';
import { ProductSwap } from './screens/ProductSwap';
import { RecipeView } from './screens/RecipeView';
import { Shopping } from './screens/Shopping';
import { Start } from './screens/Start';
import { Swap } from './screens/Swap';
import { Week } from './screens/Week';

function Splash() {
  return (
    <div className="splash" role="status" aria-label="Jídelníček se načítá">
      <img src="./icon.svg" alt="" width="96" height="96" />
      <strong>Jídelníček</strong>
      <span>Týden jídla s Claudem</span>
    </div>
  );
}

/**
 * A link from Claude carries the week in the query string. Import it once, then drop the query
 * from the address, so a reload or a home-screen start does not overwrite later edits.
 */
function importFromLink(): void {
  const parsed = parseWeekLink(window.location.search);
  if (!parsed) return;
  actions.importWeek(parsed.week, parsed.household);
  window.history.replaceState(null, '', `${window.location.pathname}#/`);
}
importFromLink();

const int = (s: string | undefined, max: number): number | undefined => {
  const n = Number(s);
  return s !== undefined && Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
};

function Screen() {
  const [name, a, b, c, d] = useRoute();
  const week = useStore().week;

  // Recipes can be opened without a plan; everything else needs one.
  if (name === 'recipe' && int(a, 1e6) !== undefined) {
    return <RecipeView id={Number(a)} dayIdx={week ? int(b, 6) : undefined} mealIdx={week ? int(c, 5) : undefined} pick={d === 'vybrat' && week?.status === 'draft'} />;
  }
  if (name === 'fav') return <Favorites />;
  if (!week || name === 'start') return <Start />;


  if (name === 'swap') {
    const dayIdx = int(a, 6);
    const mealIdx = int(b, 5);
    if (dayIdx !== undefined && mealIdx !== undefined && week.days[dayIdx].meals[mealIdx] && week.status === 'draft') {
      return <Swap dayIdx={dayIdx} mealIdx={mealIdx} />;
    }
  }
  if (name === 'week') return <Week />;
  if (name === 'shop') return <Shopping />;
  if (name === 'produkt' && int(a, 1e7) !== undefined) return <ProductSwap ingredientId={Number(a)} />;
  return <Planner dayIdx={name === 'd' ? int(a, 6) ?? 0 : 0} />;
}

export function App() {
  const [splash, setSplash] = useState(true);
  const route = useRoute().join('/');

  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 1100);
    return () => window.clearTimeout(t);
  }, []);

  // A new screen starts at the top; going back returns to where it was left.
  useLayoutEffect(() => {
    const entry = currentEntry();
    recordRoute(entry, route);
    onRouteChange(entry);
  }, [route]);

  return (
    <>
      <Screen />
      {splash && <Splash />}
    </>
  );
}
