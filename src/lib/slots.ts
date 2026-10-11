import type { Slot, Tag } from './types';

export const SLOT: Record<Slot, { label: string; acc: string; tint: string; ink: string }> = {
  sn: { label: 'Snídaně', acc: 'snídani', tint: '#FBE9C6', ink: '#8A5A00' },
  sv: { label: 'Svačina', acc: 'svačinu', tint: '#DDEBF7', ink: '#235A8C' },
  po: { label: 'Polévka', acc: 'polévku', tint: '#F6DDD0', ink: '#9A4A1E' },
  ob: { label: 'Oběd', acc: 'oběd', tint: '#DCEBE2', ink: '#1F6B4A' },
  ve: { label: 'Večeře', acc: 'večeři', tint: '#E7DFF3', ink: '#5B3F8C' },
  de: { label: 'Dezert', acc: 'dezert', tint: '#F7DCE6', ink: '#99335C' },
};

export const TAG_LABEL: Record<Tag, string> = {
  kure: 'Kuře',
  ryba: 'Ryba',
  hovezi: 'Hovězí',
  veprove: 'Vepřové',
  bezmasa: 'Bez masa',
  '': '',
};

export const WEEKDAY_SLOTS: Slot[] = ['sn', 'sv', 'ob', 've'];
export const WEEKEND_SLOTS: Slot[] = ['sn', 'po', 'ob', 've', 'de'];

/** "Quick" threshold in minutes for the swap filter. */
export function quickLimit(slot: Slot): number {
  return slot === 've' || slot === 'ob' || slot === 'po' ? 25 : 15;
}
