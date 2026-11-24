import type { Category, Domain } from './models';
export const domains: { name: Domain; metrics: string[] }[] = [
  { name: 'Shelter', metrics: [] },
  { name: 'Monetary', metrics: [] },
  { name: 'Mental', metrics: ['Sleep'] },
  { name: 'Physical', metrics: ['Weight', 'Calories'] },
];
export const questSizes = {
  tiny: { label: 'Tiny', xp: 25, rate: 1 },
  small: { label: 'Small', xp: 50, rate: 2 },
  medium: { label: 'Medium', xp: 100, rate: 4 },
  large: { label: 'Large', xp: 200, rate: 8 },
  veryLarge: { label: 'Very large', xp: 400, rate: 16 },
};
export type QuestSize = keyof typeof questSizes;
export const questSizeKeys = Object.keys(questSizes) as QuestSize[];

export function questSizeFor(xp: number): QuestSize {
  return questSizeKeys.reduce((closest, size) =>
    Math.abs(questSizes[size].xp - xp) < Math.abs(questSizes[closest].xp - xp)
      ? size
      : closest,
  );
}
export function classDomain(category: Category, general: Domain): Domain {
  return category === 'general'
    ? general
    : category === 'professional'
      ? 'Monetary'
      : 'Mental';
}
