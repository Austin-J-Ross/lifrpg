export const domainNames = [
  'Shelter',
  'Monetary',
  'Mental',
  'Physical',
] as const;
export type Domain = (typeof domainNames)[number];
export const categories = [
  'personal',
  'artistic',
  'professional',
  'general',
] as const;
export type Category = (typeof categories)[number];
export interface Profile {
  firstName: string;
  lastName: string;
  pronouns: string;
  location: string;
  bio: string;
  portrait?: string;
}
export interface Skill {
  id: string;
  name: string;
  xp: number;
}
export interface CharacterClass {
  id: string;
  name: string;
  category: Category;
  domain: Domain;
  summary: string;
  level: number;
  xp: number;
  max: number;
  color: string;
  tint: string;
  skills: Skill[];
}
export interface Quest {
  id: string;
  title: string;
  classId: string;
  skillId: string;
  deadline: number;
  xp: number;
  rate: number;
  noDamage: boolean;
}
export interface AppState {
  version: 2;
  profile: Profile;
  classes: CharacterClass[];
  quests: Quest[];
}
export function emptyState(): AppState {
  return {
    version: 2,
    profile: {
      firstName: '',
      lastName: '',
      pronouns: '',
      location: '',
      bio: '',
    },
    classes: [],
    quests: [],
  };
}
