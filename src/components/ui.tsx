import { useState, type ReactNode } from 'react';
import { SLOT } from '../lib/slots';
import { actions, MAX_SERVINGS, useStore } from '../lib/store';
import { goBack } from '../lib/router';
import type { Slot } from '../lib/types';

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const Icon = {
  back: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  swap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...stroke} aria-hidden="true">
      <path d="M4 8h13l-3-3" />
      <path d="M20 16H7l3 3" />
    </svg>
  ),
  refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4" />
    </svg>
  ),
  search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.6" {...stroke} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  heart: ({ filled }: { filled: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2" {...stroke} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
};

/** Drawn plate, shown while a photo loads or when it cannot be loaded. */
export function PlateArt({ slot }: { slot: Slot }) {
  return (
    <svg viewBox="0 0 100 100" className="plate" style={{ color: SLOT[slot].ink }} aria-hidden="true">
      <circle cx="50" cy="53" r="38" fill="rgba(28,38,33,0.10)" />
      <circle cx="50" cy="50" r="38" fill="#FFFFFF" />
      <circle className="rim" cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

export function RecipeImage({ recipe, slot, className = '' }: { recipe: { image: string } | undefined; slot: Slot; className?: string }) {
  // Keyed by URL, so a swapped recipe starts loading again instead of inheriting the old state.
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const src = recipe?.image && failed !== recipe.image ? recipe.image : null;
  const ready = src !== null && loaded === src;
  return (
    <div className={`photo ${src && !ready ? 'is-loading' : ''} ${className}`} style={{ background: SLOT[slot].tint }}>
      <PlateArt slot={slot} />
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={ready ? 'ready' : ''}
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
        />
      )}
    </div>
  );
}

export function Stepper({ value, onChange, label = 'porcí' }: { value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`Méně ${label}`} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span aria-live="polite">pro {value}</span>
      <button type="button" aria-label={`Více ${label}`} disabled={value >= MAX_SERVINGS} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function Heart({ recipeId, className = '' }: { recipeId: number; className?: string }) {
  const fav = useStore().favorites.includes(recipeId);
  return (
    <button
      type="button"
      className={`heart ${fav ? 'on' : ''} ${className}`}
      aria-pressed={fav}
      aria-label={fav ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
      onClick={() => actions.toggleFavorite(recipeId)}
    >
      <Icon.heart filled={fav} />
    </button>
  );
}

export function TopBar({ title, sub, back, right }: { title: string; sub?: string; back: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      <button type="button" className="iconbtn" aria-label="Zpět" onClick={() => goBack(back)}>
        <Icon.back />
      </button>
      <div className="topbar-text">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function TimeMeta({ minutes, children }: { minutes: number | null; children?: ReactNode }) {
  return (
    <div className="meta">
      {minutes != null && (
        <>
          <Icon.clock />
          <span>{minutes} min</span>
        </>
      )}
      {children}
    </div>
  );
}

/** Shown when Rohlík cannot be reached. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="notice error" role="alert">
      <span>{message}</span>
      <button type="button" className="btn soft small" onClick={onRetry}>
        Zkusit znovu
      </button>
    </div>
  );
}

/** Copies text; returns false when the browser does not allow it. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
