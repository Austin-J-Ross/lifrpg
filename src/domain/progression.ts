export const SKILL_XP_BASE = 100,
  SKILL_XP_GROWTH = 1.5;
export function skillProgress(totalXP: number) {
  let level = 1,
    xp = Math.max(0, totalXP),
    next = SKILL_XP_BASE;
  while (xp >= next) {
    xp -= next;
    level++;
    next = Math.ceil(SKILL_XP_BASE * SKILL_XP_GROWTH ** (level - 1));
  }
  return { level, xp, next };
}
export const MAX_SKILL_LEVEL = skillProgress(Number.MAX_SAFE_INTEGER).level;
export const MAX_CLASS_LEVEL =
  Math.floor((Number.MAX_SAFE_INTEGER - 500) / 200) + 1;

export function skillXPForLevel(totalXP: number, level: number) {
  let base = 0;
  for (let current = 1; current < level; current++) {
    base += Math.ceil(SKILL_XP_BASE * SKILL_XP_GROWTH ** (current - 1));
  }
  const { xp } = skillProgress(totalXP);
  const next = Math.ceil(SKILL_XP_BASE * SKILL_XP_GROWTH ** (level - 1));
  return base + Math.min(xp, next - 1, Number.MAX_SAFE_INTEGER - base);
}
export function classProgress(level: number, xp: number, max: number) {
  if (xp < max) return { level, xp, max };
  const count = Math.floor(
    (-(max - 100) + Math.sqrt((max - 100) ** 2 + 400 * xp)) / 200,
  );
  let steps = Math.max(1, count);
  let spent = steps * max + 100 * steps * (steps - 1);
  if (spent > xp) {
    steps--;
    spent = steps * max + 100 * steps * (steps - 1);
  }
  return { level: level + steps, xp: xp - spent, max: max + steps * 200 };
}
