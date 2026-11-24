import type { Category, Domain } from './models';
export const domains: { name: Domain; color: string }[] = [
  { name: 'Shelter', color: '#7f9272' },
  { name: 'Monetary', color: '#9b9b6b' },
  { name: 'Mental', color: '#9b8bac' },
  { name: 'Physical', color: '#72979a' },
];
export const questSizes = {
  tiny: { label: 'Tiny', xp: 25, rate: 1 },
  small: { label: 'Small', xp: 50, rate: 2 },
  medium: { label: 'Medium', xp: 100, rate: 4 },
  large: { label: 'Large', xp: 200, rate: 8 },
  veryLarge: { label: 'Very large', xp: 400, rate: 16 },
};
export type QuestSize = keyof typeof questSizes;
export function classDomain(category: Category, general: Domain): Domain {
  return category === 'general'
    ? general
    : category === 'professional'
      ? 'Monetary'
      : 'Mental';
}
