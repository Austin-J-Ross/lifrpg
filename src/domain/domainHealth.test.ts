import { expect, it } from 'vitest';
import legacy from '../../tests/fixtures/legacy-v1.json';
import { decodeState } from '../persistence/schema';
import { reduceState } from '../state/reducer';
import { advanceDomainHealth } from './domainHealth';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).getTime();

it('settles midnight damage and morning healing in order without reapplying either', () => {
  const state = decodeState(legacy);
  const quests = state.quests.map((quest, i) => ({
    ...quest,
    deadline: at(i === 2 ? 25 : 24, 23, 59),
    rate: i === 0 ? 20 : i === 1 ? 3 : 0,
  }));
  const initial = advanceDomainHealth({ ...state, quests }, at(24, 22));
  expect(initial.domainHealth?.domains.Mental.hp).toBe(100);
  expect(advanceDomainHealth(initial, at(24, 23, 59))).toBe(initial);

  const midnight = advanceDomainHealth(initial, at(25, 0));
  expect(midnight.domainHealth?.domains.Mental.hp).toBe(80);
  expect(midnight.quests[0].damageDealt).toBe(20);
  expect(advanceDomainHealth(midnight, at(25, 0))).toBe(midnight);

  const completed = reduceState(midnight, {
    type: 'quest/complete',
    id: quests[0].id,
    at: at(25, 1),
  });
  const later = advanceDomainHealth(completed, at(26, 7));
  expect(later.domainHealth?.domains.Mental.hp).toBe(90);
  expect(later.domainHealth?.domains.Shelter.hp).toBe(100);
  expect(later.quests[0].damageDealt).toBe(20);
  expect(later.quests[1].damageDealt).toBe(6);
});
