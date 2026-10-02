import { formatBerlinDay } from './berlin-day';

describe('formatBerlinDay', () => {
  it.each([
    ['2026-10-02T10:00:00Z', 'Freitag, 2. Oktober'],
    ['2026-10-02T21:59:00Z', 'Freitag, 2. Oktober'],
    ['2026-10-02T22:30:00Z', 'Samstag, 3. Oktober'],
  ])('formats %s as the Berlin day %s', (instant, expected) => {
    expect(formatBerlinDay(new Date(instant))).toBe(expected);
  });
});
