export const measurementKinds = ['sleep', 'weight', 'calories'] as const;
export type MeasurementKind = (typeof measurementKinds)[number];

export interface Measurement {
  kind: MeasurementKind;
  date: string;
  value: number;
  unit: 'h' | 'lb' | 'kg' | 'kcal';
}

export function localDate(now: number) {
  const date = new Date(now);
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function validMeasurementDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validMeasurementValue({ kind, unit, value }: Measurement) {
  if (!Number.isFinite(value) || value < 0) return false;
  switch (kind) {
    case 'sleep':
      return unit === 'h' && value <= 24;
    case 'weight':
      return (unit === 'lb' || unit === 'kg') && value > 0;
    case 'calories':
      return unit === 'kcal' && Number.isSafeInteger(value);
  }
}
