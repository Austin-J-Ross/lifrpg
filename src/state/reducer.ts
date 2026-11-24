import type {
  AppState,
  Profile,
  Category,
  Domain,
  Quest,
  QuestKind,
} from '../domain/models';
import {
  classDomain,
  questSizeFor,
  questSizes,
  type QuestSize,
} from '../domain/definitions';
import {
  classProgress,
  MAX_CLASS_LEVEL,
  MAX_SKILL_LEVEL,
  skillXPForLevel,
} from '../domain/progression';
import { validateState } from '../persistence/schema';
import type { BodyStatus, PhysicalStats, UnitSystem } from '../domain/physical';
import type { MentalLogEntry, MentalStats } from '../domain/mental';
export type Action =
  | { type: 'profile/save'; profile: Profile }
  | { type: 'physical/stats-save'; stats: PhysicalStats }
  | { type: 'physical/set-units'; units: UnitSystem }
  | { type: 'physical/status-log'; status: BodyStatus }
  | { type: 'mental/stats-save'; stats: MentalStats }
  | { type: 'mental/log'; entry: MentalLogEntry }
  | {
      type: 'class/create';
      id: string;
      skillId: string;
      name: string;
      category: Category;
      domain: Domain;
      summary: string;
    }
  | { type: 'skill/create'; classId: string; id: string; name: string }
  | {
      type: 'class/edit';
      id: string;
      name: string;
      category: Category;
      domain: Domain;
      summary: string;
      level: number;
    }
  | {
      type: 'skill/edit';
      classId: string;
      id: string;
      name: string;
      level: number;
    }
  | {
      type: 'quest/create' | 'quest/edit';
      id: string;
      title: string;
      classId: string;
      skillId: string;
      deadline: number;
      size: QuestSize;
      kind?: QuestKind;
      noDamage: boolean;
    }
  | { type: 'quest/complete'; id: string; at: number }
  | { type: 'state/import'; state: AppState };
export function reduceState(state: AppState, action: Action): AppState {
  let next: AppState;
  switch (action.type) {
    case 'state/import':
      return validateState(action.state);
    case 'mental/stats-save':
      next = {
        ...state,
        mental: {
          stats: { ...state.mental?.stats, ...action.stats },
          logs: state.mental?.logs ?? [],
        },
      };
      break;
    case 'mental/log':
      next = {
        ...state,
        mental: {
          stats: state.mental?.stats ?? {},
          logs: [action.entry, ...(state.mental?.logs ?? [])],
        },
      };
      break;
    case 'physical/stats-save':
      next = {
        ...state,
        physical: {
          ...state.physical,
          stats: { ...state.physical?.stats, ...action.stats },
          statuses: state.physical?.statuses ?? [],
        },
      };
      break;
    case 'physical/set-units':
      next = {
        ...state,
        physical: {
          stats: state.physical?.stats ?? {},
          statuses: state.physical?.statuses ?? [],
          units: action.units,
        },
      };
      break;
    case 'physical/status-log':
      next = {
        ...state,
        physical: {
          ...state.physical,
          stats: state.physical?.stats ?? {},
          statuses: [action.status, ...(state.physical?.statuses ?? [])],
        },
      };
      break;
    case 'profile/save': {
      const profile = Object.fromEntries(
        Object.entries(action.profile).map(([key, value]) => [
          key,
          value.trim(),
        ]),
      ) as unknown as Profile;
      next = { ...state, profile };
      break;
    }
    case 'class/create': {
      const name = action.name.trim();
      if (!name) throw Error('Enter a class name.');
      if (
        state.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())
      )
        throw Error('A class with this name already exists.');
      next = {
        ...state,
        classes: [
          ...state.classes,
          {
            id: action.id,
            name,
            category: action.category,
            domain: classDomain(action.category, action.domain),
            summary: action.summary.trim(),
            level: 1,
            xp: 0,
            max: 500,
            color: '#637b56',
            tint: '#e9eee3',
            skills: [{ id: action.skillId, name: 'General', xp: 0 }],
          },
        ],
      };
      break;
    }
    case 'skill/create': {
      const name = action.name.trim();
      const c = state.classes.find((c) => c.id === action.classId);
      if (!c || !name) throw Error('Enter a skill name for an existing class.');
      if (c.skills.some((s) => s.name.toLowerCase() === name.toLowerCase()))
        throw Error('That skill already exists in this class.');
      next = {
        ...state,
        classes: state.classes.map((c) =>
          c.id === action.classId
            ? { ...c, skills: [...c.skills, { id: action.id, name, xp: 0 }] }
            : c,
        ),
      };
      break;
    }
    case 'class/edit': {
      const current = state.classes.find((entry) => entry.id === action.id);
      const name = action.name.trim();
      if (!current || !name) throw Error('Enter a name for an existing class.');
      if (
        state.classes.some(
          (entry) =>
            entry.id !== current.id &&
            entry.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw Error('A class with this name already exists.');
      if (
        !Number.isSafeInteger(action.level) ||
        action.level < 1 ||
        (action.level > MAX_CLASS_LEVEL && action.level !== current.level)
      )
        throw Error('Enter a valid class level.');
      const max =
        action.level === current.level
          ? current.max
          : 500 + (action.level - 1) * 200;
      const updated = {
        ...current,
        name,
        category: action.category,
        domain:
          action.category === current.category &&
          action.domain === current.domain
            ? current.domain
            : classDomain(action.category, action.domain),
        summary: action.summary.trim(),
        level: action.level,
        max,
        xp: Math.min(current.xp, max - 1),
      };
      next = {
        ...state,
        classes: state.classes.map((entry) =>
          entry.id === current.id ? updated : entry,
        ),
      };
      break;
    }
    case 'skill/edit': {
      const current = state.classes.find(
        (entry) => entry.id === action.classId,
      );
      const skill = current?.skills.find((entry) => entry.id === action.id);
      const name = action.name.trim();
      if (!current || !skill || !name)
        throw Error('Enter a name for an existing skill.');
      if (skill.name === 'General' && name !== 'General')
        throw Error('The General skill keeps its name.');
      if (
        current.skills.some(
          (entry) =>
            entry.id !== skill.id &&
            entry.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw Error('That skill already exists in this class.');
      if (
        !Number.isSafeInteger(action.level) ||
        action.level < 1 ||
        action.level > MAX_SKILL_LEVEL
      )
        throw Error('Enter a valid skill level.');
      const updated = {
        ...skill,
        name,
        xp: skillXPForLevel(skill.xp, action.level),
      };
      next = {
        ...state,
        classes: state.classes.map((entry) =>
          entry.id === current.id
            ? {
                ...current,
                skills: current.skills.map((item) =>
                  item.id === skill.id ? updated : item,
                ),
              }
            : entry,
        ),
      };
      break;
    }
    case 'quest/create':
    case 'quest/edit': {
      const previous =
        action.type === 'quest/edit'
          ? state.quests.find(
              (quest) => quest.id === action.id && isActiveQuest(quest),
            )
          : undefined;
      if (action.type === 'quest/edit' && !previous)
        throw Error('This quest is no longer active.');
      const size = questSizes[action.size];
      if (!size) throw Error('Choose a quest size.');
      const title = action.title.trim();
      if (!title) throw Error('Enter a quest objective.');
      const sameSize =
        previous &&
        (previous.size ?? questSizeFor(previous.xp)) === action.size;
      const quest: Quest = {
        id: action.id,
        title,
        classId: action.classId,
        skillId: action.skillId,
        deadline: action.deadline,
        xp: sameSize ? previous.xp : size.xp,
        rate: action.noDamage
          ? 0
          : sameSize && !previous.noDamage
            ? previous.rate
            : size.rate,
        noDamage: action.noDamage,
        size: action.size,
        ...(action.kind && { kind: action.kind }),
      };
      next = {
        ...state,
        quests: previous
          ? state.quests.map((entry) =>
              entry.id === previous.id ? quest : entry,
            )
          : [...state.quests, quest],
      };
      break;
    }
    case 'quest/complete': {
      const q = state.quests.find(
        (q) => q.id === action.id && isActiveQuest(q),
      );
      if (!q) return state;
      next = {
        ...state,
        quests: state.quests.map((quest) =>
          quest.id === q.id ? { ...quest, completedAt: action.at } : quest,
        ),
        classes: state.classes.map((c) =>
          c.id === q.classId
            ? {
                ...c,
                ...classProgress(c.level, c.xp + q.xp, c.max),
                skills: c.skills.map((s) =>
                  s.id === q.skillId ? { ...s, xp: s.xp + q.xp } : s,
                ),
              }
            : c,
        ),
      };
      break;
    }
  }
  return validateState(next);
}
export const isActiveQuest = (quest: Quest) => quest.completedAt === undefined;
export const activeQuestCount = (state: AppState) =>
  state.quests.filter(isActiveQuest).length;
