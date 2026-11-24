import {
  categories,
  domainNames,
  questKinds,
  type AppState,
  type CharacterClass,
  type Profile,
  emptyState,
} from '../domain/models';
import { questSizeKeys } from '../domain/definitions';
import {
  measurementKinds,
  validMeasurementDate,
  validMeasurementValue,
  type Measurement,
} from '../domain/measurements';
type RecordValue = Record<string, unknown>;
export function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid saved object.');
  return value as RecordValue;
}
function text(value: unknown, max: number, required = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (required && !value.trim())
  )
    throw Error('Invalid saved text.');
  return value;
}
function number(value: unknown, min = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < min)
    throw Error('Invalid saved number.');
  return value as number;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw Error('Invalid saved list.');
  return value;
}
function oneOf<T extends string>(value: unknown, values: readonly T[]): T {
  if (!values.includes(value as T)) throw Error('Invalid saved option.');
  return value as T;
}
function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length)
    throw Error('Duplicate saved identifiers or names.');
}
function profile(value: unknown): Profile {
  const p = record(value);
  const portrait =
    p.portrait === undefined ? undefined : text(p.portrait, 1398140);
  if (
    portrait &&
    !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      portrait,
    )
  )
    throw Error('Invalid saved portrait.');
  return {
    firstName: text(p.firstName, 40),
    lastName: text(p.lastName, 40),
    pronouns: text(p.pronouns, 40),
    location: text(p.location, 80),
    bio: text(p.bio, 300),
    ...(portrait ? { portrait } : {}),
  };
}
export function validateState(value: unknown): AppState {
  const saved = record(value);
  if (saved.version !== 2)
    throw Error('Unsupported save version. Original data has been retained.');
  const classes = array(saved.classes).map((value): CharacterClass => {
    const c = record(value);
    const skills = array(c.skills).map((value) => {
      const s = record(value);
      return {
        id: text(s.id, 160, true),
        name: text(s.name, 50, true),
        xp: number(s.xp),
      };
    });
    unique(skills.map((s) => s.id));
    unique(skills.map((s) => s.name.toLowerCase()));
    if (!skills.some((s) => s.name === 'General'))
      throw Error('A class must include General.');
    const xp = number(c.xp),
      max = number(c.max, 1);
    if (xp >= max) throw Error('Invalid class progress.');
    const color = text(c.color, 7),
      tint = text(c.tint, 7);
    if (!/^#[0-9a-f]{6}$/i.test(color) || !/^#[0-9a-f]{6}$/i.test(tint))
      throw Error('Invalid class colors.');
    return {
      id: text(c.id, 160, true),
      name: text(c.name, 50, true),
      category: oneOf(c.category, categories),
      domain: oneOf(c.domain, domainNames),
      summary: text(c.summary, 180),
      level: number(c.level, 1),
      xp,
      max,
      color,
      tint,
      skills,
    };
  });
  unique(classes.map((c) => c.id));
  unique(classes.map((c) => c.name.toLowerCase()));
  const quests = array(saved.quests).map((value) => {
    const q = record(value);
    const classId = text(q.classId, 160, true),
      skillId = text(q.skillId, 160, true);
    const c = classes.find((c) => c.id === classId);
    if (!c?.skills.some((s) => s.id === skillId))
      throw Error('Quest refers to a missing class or skill.');
    const deadline = number(q.deadline, -8640000000000000);
    if (Number.isNaN(new Date(deadline).getTime()))
      throw Error('Invalid quest deadline.');
    if (typeof q.noDamage !== 'boolean') throw Error('Invalid damage setting.');
    const rate = number(q.rate);
    if (q.noDamage && rate !== 0)
      throw Error('No-damage quests must have zero damage.');
    return {
      id: text(q.id, 160, true),
      title: text(q.title, 90, true),
      classId,
      skillId,
      deadline,
      xp: number(q.xp),
      rate,
      noDamage: q.noDamage,
      ...(q.kind === undefined ? {} : { kind: oneOf(q.kind, questKinds) }),
      ...(q.size === undefined ? {} : { size: oneOf(q.size, questSizeKeys) }),
    };
  });
  unique(quests.map((q) => q.id));
  const measurements =
    saved.measurements === undefined
      ? undefined
      : array(saved.measurements).map((value): Measurement => {
          const entry = record(value);
          const date = text(entry.date, 10);
          if (!validMeasurementDate(date) || typeof entry.value !== 'number')
            throw Error('Invalid saved measurement.');
          const measurement = {
            kind: oneOf(entry.kind, measurementKinds),
            date,
            value: entry.value,
            unit: oneOf(entry.unit, ['h', 'lb', 'kg', 'kcal'] as const),
          };
          if (!validMeasurementValue(measurement))
            throw Error('Invalid saved measurement.');
          return measurement;
        });
  if (measurements) unique(measurements.map(({ kind, date }) => kind + date));
  return {
    version: 2,
    profile: profile(saved.profile),
    classes,
    quests,
    ...(measurements ? { measurements } : {}),
  };
}
export function decodeState(value: unknown): AppState {
  const raw = record(value);
  if (raw.version === 2) return validateState(raw);
  if (raw.version !== 1)
    throw Error('Unsupported save version. Original data has been retained.');
  const classes = array(raw.classes).map((value, i) => {
    const c = record(value);
    return {
      ...c,
      id: 'legacy-class-' + i,
      category: c.category || 'general',
      summary: c.summary || '',
      skills: array(c.skills).map((value, j) => ({
        ...record(value),
        id: 'legacy-skill-' + i + '-' + j,
      })),
    };
  });
  const quests = array(raw.quests).map((value, i) => {
    const q = record(value);
    const c = classes[number(q.classId)];
    const s = c?.skills.find((s) => record(s).name === q.skill);
    if (!c || !s)
      throw Error('Legacy quest refers to a missing class or skill.');
    return {
      ...q,
      id: 'legacy-quest-' + i,
      classId: c.id,
      skillId: s.id,
      noDamage: q.noDamage === true,
      rate: q.noDamage === true ? 0 : q.rate,
    };
  });
  return validateState({
    version: 2,
    profile: { ...emptyState().profile, ...record(raw.profile ?? {}) },
    classes,
    quests,
  });
}
