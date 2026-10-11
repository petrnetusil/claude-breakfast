import { Heart, RecipeImage, TimeMeta, TopBar } from '../components/ui';
import { getRecipe } from '../data/recipes';
import { href } from '../lib/router';
import { TAG_LABEL } from '../lib/slots';
import { useStore } from '../lib/store';
import type { Recipe } from '../lib/types';

function Row({ recipe, note }: { recipe: Recipe; note?: string }) {
  const link = href(`recipe/${recipe.id}`);
  return (
    <article className="idea">
      <a href={link} aria-label={`Otevřít recept: ${recipe.title}`}>
        <RecipeImage recipe={recipe} slot={recipe.slots[0]} className="thumb" />
      </a>
      <div className="meal-text">
        <a className="meal-title" href={link}>
          {recipe.title}
        </a>
        <TimeMeta minutes={recipe.time}>{recipe.tag && <span className="chip">{TAG_LABEL[recipe.tag]}</span>}</TimeMeta>
        {note && <p className="muted">{note}</p>}
      </div>
      <Heart recipeId={recipe.id} className="corner" />
    </article>
  );
}

export function Favorites() {
  const state = useStore();
  const favorites = state.favorites.map((id) => getRecipe(id)).filter((r): r is Recipe => !!r);
  const often = Object.entries(state.cooked)
    .map(([id, c]) => ({ recipe: getRecipe(Number(id)), count: c.count }))
    .filter((x): x is { recipe: Recipe; count: number } => !!x.recipe && !state.favorites.includes(x.recipe.id))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="screen">
      <TopBar title="Oblíbená jídla" sub="Při návrhu týdne i výměně dostávají přednost" back="" />

      {favorites.length === 0 ? (
        <div className="empty">
          <strong>Zatím nic</strong>
          <span>Srdíčkem u jídla si ho uložíte. Najdete ho pak tady a ve výměně pod „Oblíbené“.</span>
        </div>
      ) : (
        <div className="cards">
          {favorites.map((recipe) => (
            <Row key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {often.length > 0 && (
        <>
          <h2 className="section-title">Často v jídelníčku</h2>
          <div className="cards">
            {often.map(({ recipe, count }) => (
              <Row key={recipe.id} recipe={recipe} note={`Ve schváleném týdnu ${count}×`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
