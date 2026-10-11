import { Heart, LoadError, RecipeImage, TimeMeta, TopBar } from '../components/ui';
import { href } from '../lib/router';
import { useStore } from '../lib/store';
import { useCards } from '../lib/useRohlik';
import type { RecipeCard } from '../lib/types';

function Row({ recipe }: { recipe: RecipeCard }) {
  const link = href(`recipe/${recipe.id}`);
  return (
    <article className="idea">
      <a href={link} aria-label={`Otevřít recept: ${recipe.title}`}>
        <RecipeImage recipe={recipe} slot="ve" className="thumb" />
      </a>
      <div className="meal-text">
        <a className="meal-title" href={link}>
          {recipe.title}
        </a>
        <TimeMeta minutes={recipe.time} />
      </div>
      <Heart recipeId={recipe.id} className="corner" />
    </article>
  );
}

export function Favorites() {
  const { favorites } = useStore();
  const { data, loading, error, retry } = useCards(favorites);
  const list = favorites.map((id) => data.get(id)).filter((r): r is RecipeCard => !!r);

  return (
    <div className="screen">
      <TopBar title="Oblíbená jídla" sub="Najdete je i ve výměně jídla pod „Oblíbené“" back="" />
      {error && <LoadError message={error} onRetry={retry} />}
      {favorites.length === 0 ? (
        <div className="empty">
          <strong>Zatím nic</strong>
          <span>Srdíčkem u jídla si ho uložíte. Claudovi můžete napsat „dej tam něco z oblíbených“ a vložit mu je.</span>
        </div>
      ) : (
        <div className="cards">
          {list.map((recipe) => (
            <Row key={recipe.id} recipe={recipe} />
          ))}
          {loading && list.length < favorites.length && <p className="muted center loading-line">Načítám z Rohlíku…</p>}
        </div>
      )}
    </div>
  );
}
