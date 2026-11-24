export const monthlyCosts = {
  subscriptions: 'Subscriptions',
  food: 'Food',
  housing: 'Housing',
  utilities: 'Utilities',
  stuffFun: 'Stuff/Fun',
} as const;

export const homeHealth = {
  clutter: 'Clutter',
  cleanliness: 'Cleanliness',
  maintenance: 'Maintenance',
  stock: 'Stock',
} as const;

export type LifeStatKey = keyof typeof monthlyCosts | keyof typeof homeHealth;
export type LifeStats = Partial<Record<LifeStatKey, number>>;
export const lifeStatKeys = [
  ...Object.keys(monthlyCosts),
  ...Object.keys(homeHealth),
] as LifeStatKey[];
export const maxCostCents = 99_999_999_999;

export function isMonthlyCost(key: LifeStatKey) {
  return Object.hasOwn(monthlyCosts, key);
}

export function parseLifeStat(
  key: LifeStatKey,
  raw: string,
): number | undefined {
  const input = raw.trim();
  if (!input) return undefined;
  if (isMonthlyCost(key)) {
    const match = /^(\d*)(?:\.(\d{1,2}))?$/.exec(input);
    if (!match || (!match[1] && !match[2]))
      throw Error(
        'Enter a nonnegative dollar amount with up to two decimal places.',
      );
    const dollars = Number(match[1]);
    const cents = dollars * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    if (!Number.isSafeInteger(cents) || cents > maxCostCents)
      throw Error('Enter an amount up to $999,999,999.99.');
    return cents;
  }
  const value = Number(input);
  if (!/^\d+$/.test(input) || !Number.isSafeInteger(value))
    throw Error('Enter a nonnegative whole number for total HP.');
  return value;
}
