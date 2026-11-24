import type { Category, Domain } from './models';
export const domains: { name: Domain; value: number; metrics: string[] }[] = [
  { name: 'Shelter', value: 86, metrics: [] },
  { name: 'Monetary', value: 74, metrics: [] },
  { name: 'Mental', value: 62, metrics: ['Sleep'] },
  { name: 'Physical', value: 81, metrics: ['Weight', 'Calories'] },
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
