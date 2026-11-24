import { it, expect } from 'vitest';
import legacy from '../../tests/fixtures/legacy-v1.json';
import { decodeState } from '../persistence/schema';
import { reduceState } from './reducer';
it('awards XP once and preserves the incoming state', () => {
  const initial = decodeState(legacy);
  const q = initial.quests[0];
  const completed = reduceState(initial, { type: 'quest/complete', id: q.id });
  expect(completed.quests).toHaveLength(2);
  expect(completed.classes[0].xp).toBe(760);
  expect(completed.classes[0].skills[0].xp).toBe(760);
  expect(initial.classes[0].xp).toBe(640);
  expect(reduceState(completed, { type: 'quest/complete', id: q.id })).toBe(
    completed,
  );
});
it('rejects duplicate names at the action boundary', () => {
  const initial = decodeState(legacy);
  expect(() =>
    reduceState(initial, {
      type: 'skill/create',
      id: 'new',
      classId: initial.classes[0].id,
      name: ' general ',
    }),
  ).toThrow();
});
it('validates quest links and assigns rewards from size', () => {
  const initial = decodeState(legacy),
    c = initial.classes[0];
  const action = {
    type: 'quest/create' as const,
    id: 'new',
    classId: c.id,
    skillId: c.skills[0].id,
    title: 'New task',
    deadline: 123,
    size: 'tiny' as const,
    noDamage: true,
  };
  const next = reduceState(initial, action);
  expect(next.quests.at(-1)).toMatchObject({ xp: 25, rate: 0, noDamage: true });
  expect(() =>
    reduceState(initial, { ...action, skillId: 'missing' }),
  ).toThrow();
});
