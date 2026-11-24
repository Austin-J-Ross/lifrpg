import { describe, it, expect } from 'vitest';
import { skillProgress, classProgress } from './progression';
import { deadlineForDate } from './deadlines';
describe('progression and local deadlines', () => {
  it('retains cumulative skill thresholds', () => {
    expect(skillProgress(0)).toEqual({ level: 1, xp: 0, next: 100 });
    expect(skillProgress(250)).toEqual({ level: 3, xp: 0, next: 225 });
    expect(skillProgress(475)).toEqual({ level: 4, xp: 0, next: 338 });
  });
  it('advances separate class levels without losing overflow', () => {
    expect(classProgress(1, 500, 500)).toEqual({ level: 2, xp: 0, max: 700 });
    expect(classProgress(1, 1400, 500)).toEqual({
      level: 3,
      xp: 200,
      max: 900,
    });
  });
  it('matches the legacy class loop across boundaries', () => {
    for (let value = 0; value < 100000; value += 199) {
      let xp = value,
        level = 1,
        max = 500;
      while (xp >= max) {
        xp -= max;
        level++;
        max += 200;
      }
      expect(classProgress(1, value, 500)).toEqual({ xp, level, max });
    }
  });
  it('rejects impossible dates and fixes the deadline at local 23:59 around DST changes', () => {
    expect(deadlineForDate('2026-02-30')).toBeNaN();
    for (const date of ['2026-03-08', '2026-11-01', '2028-02-29']) {
      const d = new Date(deadlineForDate(date));
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(59);
      expect(d.getDate()).toBe(Number(date.slice(-2)));
    }
  });
});
