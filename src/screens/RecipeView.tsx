import { useState } from 'react';
import { Heart, Icon, RecipeImage, Stepper } from '../components/ui';
import { getRecipe, rohlikUrl } from '../data/recipes';
import { goBack, href } from '../lib/router';
import { formatAmount, roundAmount, scale } from '../lib/shopping';
import { SLOT } from '../lib/slots';
import { actions, useStore } from '../lib/store';

const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n < 5 ? few : many);

export function RecipeView({ id, dayIdx, mealIdx }: { id: number; dayIdx?: number; mealIdx?: number }) {
  const week = useStore().week;
  const recipe = getRecipe(id);
  // Opened from a meal in the plan: portions are that meal's and changes are saved to it.
  const meal = week && dayIdx != null && mealIdx != null ? week.days[dayIdx]?.meals[mealIdx] : undefined;
  const [own, setOwn] = useState(recipe?.baseServings ?? 4);
  const servings = meal ? meal.servings : own;
  const setServings = (n: number) => (meal && dayIdx != null && mealIdx != null ? actions.setServings(dayIdx, mealIdx, n) : setOwn(n));
  const back = dayIdx != null ? `d/${dayIdx}` : '';

  if (!recipe) {
    return (
      <div className="screen">
        <div className="empty">
          <strong>Recept se nenašel</strong>
          <a className="btn primary" href={href('')}>
            Zpět do jídelníčku
          </a>
        </div>
      </div>
    );
  }

  const slot = meal?.slot ?? recipe.slots[0];
  const canSwap = meal && week?.status === 'draft';

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
          <p className="slot-label" style={{ color: SLOT[slot].ink }}>
            {SLOT[slot].label}
          </p>
          <h1>{recipe.title}</h1>
          <p className="muted">Rohlík Chef · {recipe.author}</p>
        </div>

        <div className="facts">
          <div>
            <strong>{recipe.time} min</strong>
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
              const amount = scale(ing.amount, recipe.baseServings, servings);
              return (
                <li key={i}>
                  <span>{ing.name}</span>
                  <strong>{formatAmount(amount == null ? null : roundAmount(amount, ing.unit), ing.unit)}</strong>
                </li>
              );
            })}
          </ul>
          {!recipe.servingsStated && (
            <p className="note">Rohlík u receptu neuvádí počet porcí. Množství počítáme z odhadu, že originál je pro {recipe.baseServings}.</p>
          )}
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
          <p className="note">Postup je zkrácený. Celý recept je na Rohlíku.</p>
        </section>

        <a className="link-row" href={rohlikUrl(recipe)} target="_blank" rel="noreferrer">
          Otevřít recept na Rohlíku
        </a>
      </div>

      <footer className="bottom two">
        <button type="button" className="btn primary big grow" onClick={() => goBack(back)}>
          {meal ? 'Nechat v jídelníčku' : 'Zpět'}
        </button>
        {canSwap && (
          <a className="btn soft big" href={href(`swap/${dayIdx}/${mealIdx}`)}>
            Vyměnit
          </a>
        )}
      </footer>
    </div>
  );
}
