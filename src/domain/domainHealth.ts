import { daysPastDeadline } from './deadlines';
import { domainNames, type AppState, type Domain } from './models';

export const maxDomainHp = 100;
export const defaultDomainHealth = { hp: maxDomainHp, healing: 5 } as const;

export interface DomainHealth {
  at: number;
  domains: Record<Domain, { hp: number; healing: number }>;
}

export function nextHealthBoundary(after: number, hour: 0 | 7) {
  const date = new Date(after);
  date.setHours(hour, 0, 0, 0);
  if (date.getTime() <= after) {
    date.setDate(date.getDate() + 1);
    date.setHours(hour, 0, 0, 0);
  }
  return date.getTime();
}

function byDomain<T>(value: (domain: Domain) => T) {
  return Object.fromEntries(
    domainNames.map((domain) => [domain, value(domain)]),
  ) as Record<Domain, T>;
}

export function initializeDomainHealth(at: number): DomainHealth {
  return { at, domains: byDomain(() => ({ ...defaultDomainHealth })) };
}

export function advanceDomainHealth(state: AppState, now: number): AppState {
  const previous = state.domainHealth;
  if (!previous) return { ...state, domainHealth: initializeDomainHealth(now) };

  let midnight = nextHealthBoundary(previous.at, 0);
  let morning = nextHealthBoundary(previous.at, 7);
  if (Math.min(midnight, morning) > now || now <= previous.at) return state;

  const domains = byDomain((domain) => ({ ...previous.domains[domain] }));
  const costsStartingAt = new Map<number, Partial<Record<Domain, number>>>();
  const lastMidnight = new Date(now).setHours(0, 0, 0, 0);
  const classes = new Map(state.classes.map(({ id, domain }) => [id, domain]));
  const quests =
    midnight > now
      ? state.quests
      : state.quests.map((quest) => {
          const domain = classes.get(quest.classId);
          if (
            !domain ||
            quest.completedAt !== undefined ||
            quest.noDamage ||
            !quest.rate
          )
            return quest;
          const first = nextHealthBoundary(
            Math.max(previous.at, quest.deadline),
            0,
          );
          if (!(first <= lastMidnight)) return quest;
          const costs = costsStartingAt.get(first) ?? {};
          costs[domain] = Math.min(
            maxDomainHp,
            (costs[domain] ?? 0) + quest.rate,
          );
          costsStartingAt.set(first, costs);
          const days = daysPastDeadline(first, lastMidnight) + 1;
          return {
            ...quest,
            damageDealt: Math.min(
              Number.MAX_SAFE_INTEGER,
              (quest.damageDealt ?? 0) + quest.rate * days,
            ),
          };
        });

  const damage = byDomain(() => 0);
  let at = previous.at;
  while (Math.min(midnight, morning) <= now) {
    if (midnight < morning) {
      const starting = costsStartingAt.get(midnight);
      for (const domain of domainNames) {
        damage[domain] = Math.min(
          maxDomainHp,
          damage[domain] + (starting?.[domain] ?? 0),
        );
        domains[domain].hp = Math.max(0, domains[domain].hp - damage[domain]);
      }
      at = midnight;
      midnight = nextHealthBoundary(midnight, 0);
    } else {
      for (const domain of domainNames) {
        domains[domain].hp = Math.min(
          maxDomainHp,
          domains[domain].hp + domains[domain].healing,
        );
      }
      at = morning;
      morning = nextHealthBoundary(morning, 7);
    }
  }
  return { ...state, quests, domainHealth: { at, domains } };
}
