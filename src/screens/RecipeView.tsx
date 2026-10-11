import { useState } from 'react';
import { Heart, Icon, LoadError, RecipeImage, Stepper } from '../components/ui';
import { recipeUrl } from '../lib/rohlik';
import { backToDay } from '../lib/history';
import { goBack, href } from '../lib/router';
import { formatAmount, roundAmount, scale } from '../lib/shopping';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';
import { forgetSwapView, swapKey } from '../lib/swapMemory';
import { useDetail } from '../lib/useRohlik';

const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n < 5 ? few : many);

/**
 * `pick`: opened from the swap screen as a candidate for this meal. Portions are only previewed,
 * and "Vybrat do jídelníčku" puts the recipe in the plan.
 */
export function RecipeView({ id, dayIdx, mealIdx, pick = false }: { id: number; dayIdx?: number; mealIdx?: number; pick?: boolean }) {
  const week = useStore().week;
  const { data: recipe, loading, error, retry } = useDetail(id);
  // Opened from a meal in the plan: portions are that meal's and changes are saved to it.
  const planned = week && dayIdx != null && mealIdx != null ? week.days[dayIdx]?.meals[mealIdx] : undefined;
  const meal = pick ? undefined : planned;
  const [own, setOwn] = useState<number | null>(pick && planned ? planned.servings : null);
  const servings = meal ? meal.servings : own ?? recipe?.servings ?? 4;
  const setServings = (n: number) => (meal && dayIdx != null && mealIdx != null ? actions.setServings(dayIdx, mealIdx, n) : setOwn(n));
  const back = pick ? `swap/${dayIdx}/${mealIdx}` : dayIdx != null ? `d/${dayIdx}` : '';
  const slot = planned?.slot ?? 've';
  const canSwap = meal && week?.status === 'draft';
  const choose = () => {
    if (!planned || dayIdx == null || mealIdx == null) return;
    actions.setRecipe(dayIdx, mealIdx, id);
    if (own != null && own !== planned.servings) actions.setServings(dayIdx, mealIdx, own);
    forgetSwapView(swapKey(dayIdx, mealIdx));
    // Back to the day, past the swap screen (and the old meal's recipe, if she came that way).
    backToDay(dayIdx);
  };

  if (!recipe) {
    return (
      <div className="screen recipe">
        <div className="hero">
          <RecipeImage recipe={undefined} slot={slot} className={`hero-photo ${loading ? 'pending' : ''}`} />
          <button type="button" className="iconbtn floating left" aria-label="Zpět" onClick={() => goBack(back)}>
            <Icon.back />
          </button>
        </div>
        <div className="recipe-body">
          {loading ? <p className="muted center loading-line">Načítám recept z Rohlíku…</p> : <LoadError message={error ?? 'Recept se nenašel.'} onRetry={retry} />}
          {!loading && (
            <a className="btn primary" href={href(back)}>
              Zpět do jídelníčku
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen recipe with-bottom">
      <div className="hero">
        <RecipeImage recipe={recipe} slot={slot} className="hero-photo" />
        <button type="button" className="iconbtn floating left" aria-label="Zpět" onClick={() => goBack(back)}>
          <Icon.back />
        </button>
        <Heart recipeId={recipe.id} className="floating right" />
      </div>

      <div className="recipe-body">
        <div>
          {planned && (
            <p className="slot-label" style={{ color: SLOT[slot].ink }}>
              {pick ? `Návrh na ${SLOT[slot].acc}` : SLOT[slot].label}
            </p>
          )}
          <h1>{recipe.title}</h1>
          <p className="muted">Rohlík Chef{recipe.author ? ` · ${recipe.author}` : ''}</p>
        </div>

        <div className="facts">
          <div>
            <strong>{recipe.time ? `${recipe.time} min` : '–'}</strong>
            <span>příprava</span>
          </div>
          <div>
            <strong>{recipe.ingredients.length}</strong>
            <span>{plural(recipe.ingredients.length, 'surovina', 'suroviny', 'surovin')}</span>
          </div>
          <div>
            <strong>{recipe.steps.length}</strong>
            <span>{plural(recipe.steps.length, 'krok', 'kroky', 'kroků')}</span>
          </div>
        </div>

        <section className="card">
          <div className="card-head">
            <h2>Suroviny</h2>
            <Stepper value={servings} onChange={setServings} />
          </div>
          <ul className="ingredients">
            {recipe.ingredients.map((ing, i) => {
              const amount = scale(ing.amount, recipe.servings, servings);
              return (
                <li key={i}>
                  <span>{ing.name}</span>
                  <strong>{amount == null && !ing.unit ? '' : formatAmount(amount == null ? null : roundAmount(amount, ing.unit), ing.unit)}</strong>
                </li>
              );
            })}
          </ul>
          <p className="note">
            {recipe.servings == null
              ? `Recept je na ${recipe.servingsLabel || 'celou dávku'}. Množství platí pro celý recept, počet porcí je nemění.`
              : `Rohlík uvádí recept pro ${recipe.servingsLabel || `${recipe.servings} porce`}. Množství jsou přepočtená na ${servings}.`}
          </p>
        </section>

        <section className="card">
          <h2>Postup</h2>
          <ol className="steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <span className="step-num">{i + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <a className="link-row" href={recipeUrl(recipe)} target="_blank" rel="noreferrer">
          Otevřít recept na Rohlíku
        </a>
      </div>

      <footer className="bottom two">
        {pick && planned ? (
          <button type="button" className="btn primary big grow" onClick={choose}>
            Vybrat do jídelníčku
          </button>
        ) : (
          <button type="button" className="btn primary big grow" onClick={() => goBack(back)}>
            {meal ? 'Nechat v jídelníčku' : 'Zpět'}
          </button>
        )}
        {pick && (
          <button type="button" className="btn soft big" onClick={() => goBack(back)}>
            Zpět
          </button>
        )}
        {canSwap && (
          <a className="btn soft big" href={href(`swap/${dayIdx}/${mealIdx}`)}>
            Vyměnit
          </a>
        )}
      </footer>
    </div>
  );
}
