export const physicalStatGroups = {
  General: {
    age: 'Age',
    sex: 'Sex',
    height: 'Height',
    weight: 'Weight',
  },
  'Physical Stats': {
    sight: 'Sight',
    hearing: 'Hearing',
    speed: 'Speed',
    legStrength: 'Strength (legs)',
    armStrength: 'Strength (arms)',
    coreStrength: 'Strength (core)',
    endurance: 'Endurance',
    flexibility: 'Flexibility',
  },
} as const;

export const physicalStatKeys = [
  ...Object.keys(physicalStatGroups.General),
  ...Object.keys(physicalStatGroups['Physical Stats']),
] as PhysicalStatKey[];

type PhysicalStatKey =
  | keyof (typeof physicalStatGroups)['General']
  | keyof (typeof physicalStatGroups)['Physical Stats'];

export type PhysicalStats = Partial<Record<PhysicalStatKey, string>>;
export const unitSystems = ['imperial', 'metric'] as const;
export type UnitSystem = (typeof unitSystems)[number];

const centimetersPerInch = 2.54;
const kilogramsPerPound = 0.45359237;
const numberText = '(\\d+(?:[.,]\\d+)?|[.,]\\d+)';
const numericOnly = new RegExp('^' + numberText + '$');
const heightParts = new RegExp(
  '^' +
    numberText +
    '\\s*(?:ft|feet|\x27|′)(?:\\s*' +
    numberText +
    '\\s*(?:in|inches?|["″])?)?$',
  'i',
);
const simpleHeight = new RegExp(
  '^' + numberText + '\\s*(cm|m|in|inches?|["″])?$',
  'i',
);
const simpleWeight = new RegExp(
  '^' + numberText + '\\s*(kg|lbs?|pounds?)?$',
  'i',
);

export function withStatUnits(
  stats: PhysicalStats,
  units: UnitSystem,
): PhysicalStats {
  const updated = { ...stats };
  for (const field of ['height', 'weight'] as const) {
    const value = stats[field]?.trim();
    if (value && numericOnly.test(value)) {
      const unit =
        field === 'height'
          ? units === 'metric'
            ? 'cm'
            : 'in'
          : units === 'metric'
            ? 'kg'
            : 'lb';
      updated[field] = value + ' ' + unit;
    }
  }
  return updated;
}

export function displayPhysicalStat(
  key: PhysicalStatKey,
  value: string,
  units: UnitSystem,
) {
  if (!value || (key !== 'height' && key !== 'weight')) return value;
  const parse = (input: string) => Number(input.replace(',', '.'));
  const format = (input: number) =>
    input.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const input = value.trim();
  if (key === 'weight') {
    const match = simpleWeight.exec(input);
    if (!match) return value;
    const amount = parse(match[1]);
    const metric = !match[2] || match[2].toLowerCase() === 'kg';
    if (!Number.isFinite(amount)) return value;
    if (units === 'metric')
      return format(metric ? amount : amount * kilogramsPerPound) + ' kg';
    return format(metric ? amount / kilogramsPerPound : amount) + ' lb';
  }

  const feet = heightParts.exec(input);
  const height = simpleHeight.exec(input);
  if (!feet && !height) return value;
  let centimeters: number;
  if (feet) {
    centimeters =
      (parse(feet[1]) * 12 + parse(feet[2] ?? '0')) * centimetersPerInch;
  } else {
    const [, amount, rawUnit] = height!;
    const unit = rawUnit?.toLowerCase();
    centimeters =
      parse(amount) *
      (unit === 'm' ? 100 : unit && unit !== 'cm' ? centimetersPerInch : 1);
  }
  if (!Number.isFinite(centimeters)) return value;
  if (units === 'metric') return format(centimeters) + ' cm';
  const inches = Math.round((centimeters / centimetersPerInch) * 10) / 10;
  const wholeFeet = Math.floor(inches / 12);
  return wholeFeet + ' ft ' + format(inches - wholeFeet * 12) + ' in';
}

export const bodySections = [
  'Head',
  'Torso',
  'Right arm',
  'Left arm',
  'Right leg',
  'Left leg',
] as const;

export type BodySection = (typeof bodySections)[number];

export interface BodyStatus {
  id: string;
  at: number;
  section: BodySection;
  message: string;
}

export interface PhysicalProfile {
  stats: PhysicalStats;
  statuses: BodyStatus[];
  units?: UnitSystem;
}
