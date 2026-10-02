export const grades = [1, 2, 3, 4, 5, 6] as const;

export type Grade = (typeof grades)[number];

export const gradeWords: Record<Grade, string> = {
  1: 'sehr gut',
  2: 'gut',
  3: 'befriedigend',
  4: 'ausreichend',
  5: 'mangelhaft',
  6: 'ungenügend',
};

export function calculateAverage(values: readonly Grade[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatAverage(average: number): string {
  return average.toFixed(1).replace('.', ',');
}

export function describeAverage(average: number): string {
  const roundedGrade = Math.min(Math.max(Math.round(average), 1), 6) as Grade;
  return gradeWords[roundedGrade];
}
