import { Linking } from 'react-native';
import { Ingredient } from '@/types';

export function getRohlikSearchUrl(query: string): string {
  return `https://www.rohlik.cz/hledani?q=${encodeURIComponent(query)}`;
}

export function openRohlikSearch(ingredient: Ingredient): void {
  const query = ingredient.rohlikQuery || ingredient.name;
  Linking.openURL(getRohlikSearchUrl(query));
}
