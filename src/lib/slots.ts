import type { Slot } from './types';

export const SLOT: Record<Slot, { label: string; acc: string; tint: string; ink: string }> = {
  sn: { label: 'Snídaně', acc: 'snídani', tint: '#FBE9C6', ink: '#8A5A00' },
  sv: { label: 'Svačina', acc: 'svačinu', tint: '#DDEBF7', ink: '#235A8C' },
  po: { label: 'Polévka', acc: 'polévku', tint: '#F6DDD0', ink: '#9A4A1E' },
  ob: { label: 'Oběd', acc: 'oběd', tint: '#DCEBE2', ink: '#1F6B4A' },
  ve: { label: 'Večeře', acc: 'večeři', tint: '#E7DFF3', ink: '#5B3F8C' },
  de: { label: 'Dezert', acc: 'dezert', tint: '#F7DCE6', ink: '#99335C' },
};
