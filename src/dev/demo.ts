import { dayDeadline } from '../domain/deadlines';
import { decodeState } from '../persistence/schema';
const classes = [
  {
    name: 'Husband',
    category: 'personal',
    domain: 'Mental',
    level: 6,
    xp: 640,
    max: 1000,
    color: '#98606a',
    tint: '#f3e7e8',
  },
  {
    name: 'Homekeeper',
    category: 'general',
    domain: 'Shelter',
    level: 4,
    xp: 280,
    max: 600,
    color: '#8b7040',
    tint: '#f2eddf',
  },
  {
    name: 'Game Designer',
    category: 'artistic',
    domain: 'Mental',
    level: 8,
    xp: 820,
    max: 1200,
    color: '#80659e',
    tint: '#ede8f4',
  },
  {
    name: 'Materials Engineer',
    category: 'professional',
    domain: 'Monetary',
    level: 12,
    xp: 1450,
    max: 2000,
    color: '#517880',
    tint: '#e6eff0',
  },
  {
    name: 'Corporate Team Leader',
    category: 'professional',
    domain: 'Monetary',
    level: 7,
    xp: 530,
    max: 1000,
    color: '#5d7650',
    tint: '#e9eee3',
  },
  {
    name: 'Writer',
    category: 'artistic',
    domain: 'Mental',
    level: 3,
    xp: 190,
    max: 500,
    color: '#946c47',
    tint: '#f4eadf',
  },
  {
    name: 'Self Keeper',
    category: 'general',
    domain: 'Physical',
    level: 1,
    xp: 0,
    max: 500,
    color: '#517880',
    tint: '#e6eff0',
  },
];
// Existing sample class progress belongs to General; new skills start at zero.
for (const entry of classes) {
  const extra =
    entry.name === 'Writer'
      ? ['Short Stories', 'Characters']
      : entry.name === 'Game Designer'
        ? ['Mechanics']
        : [];
  Object.assign(entry, {
    skills: [
      { name: 'General', xp: entry.xp },
      ...extra.map((name) => ({ name, xp: 0 })),
    ],
  });
}
const quests = [
  {
    title: 'Plan a date night',
    classId: 0,
    xp: 120,
    skill: 'General',
    deadline: dayDeadline(1),
    domain: 'Mental',
    rate: 2,
  },
  {
    title: 'Finish the bathroom trim',
    classId: 1,
    xp: 180,
    skill: 'General',
    deadline: dayDeadline(-1),
    domain: 'Shelter',
    rate: 3,
  },
  {
    title: 'Playtest the new combat system',
    classId: 2,
    xp: 200,
    skill: 'Mechanics',
    deadline: dayDeadline(3),
    domain: 'Mental',
    rate: 2,
  },
];
function legacyDemoState() {
  return {
    version: 1,
    classes: structuredClone(classes),
    quests: structuredClone(quests),
    profile: {
      firstName: 'Douglas',
      lastName: '',
      pronouns: '',
      location: '',
      bio: '',
    },
  };
}

export const createDemoState = () => decodeState(legacyDemoState());
