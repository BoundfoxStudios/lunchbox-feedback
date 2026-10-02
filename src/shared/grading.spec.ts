import { calculateAverage, describeAverage, formatAverage } from './grading';

describe('calculateAverage', () => {
  it('returns the arithmetic mean of the given grades', () => {
    expect(calculateAverage([1, 2, 2])).toBeCloseTo(5 / 3);
  });

  it('returns null for an empty list', () => {
    expect(calculateAverage([])).toBeNull();
  });
});

describe('formatAverage', () => {
  it.each([
    [5 / 3, '1,7'],
    [2, '2,0'],
  ])('formats %d with one decimal and a comma as %s', (average, expected) => {
    expect(formatAverage(average)).toBe(expected);
  });
});

describe('describeAverage', () => {
  it.each([
    [1, 'sehr gut'],
    [1.4, 'sehr gut'],
    [1.5, 'gut'],
    [2.5, 'befriedigend'],
    [5.6, 'ungenügend'],
  ])('describes the average %d with the word of the rounded grade %s', (average, expected) => {
    expect(describeAverage(average)).toBe(expected);
  });

  it.each([
    [0.4, 'sehr gut'],
    [6.6, 'ungenügend'],
  ])('clamps the out-of-range average %d to %s', (average, expected) => {
    expect(describeAverage(average)).toBe(expected);
  });
});
