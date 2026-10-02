import { type Grade, grades } from '../shared/grading';
import {
  jpegDataUrlPrefix,
  maximumPhotoDataUrlLength,
  maximumTextLength,
  type SubjectId,
  subjects,
} from '../shared/report-card';

export interface ValidatedReportCard {
  grades: Record<SubjectId, Grade>;
  wishes: string;
  message: string;
  photo: Buffer<ArrayBuffer> | null;
}

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

export function parseReportCardSubmission(body: unknown): ValidatedReportCard | null {
  if (!isRecord(body)) {
    return null;
  }
  const subjectGrades = parseGrades(body['grades']);
  const wishes = parseText(body['wishes']);
  const message = parseText(body['message']);
  if (subjectGrades === null || wishes === null || message === null) {
    return null;
  }
  if (body['photo'] === null) {
    return { grades: subjectGrades, wishes, message, photo: null };
  }
  const photo = decodeJpegDataUrl(body['photo']);
  return photo === null ? null : { grades: subjectGrades, wishes, message, photo };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseGrades(value: unknown): Record<SubjectId, Grade> | null {
  if (!isRecord(value)) {
    return null;
  }
  const subjectGrades: Partial<Record<SubjectId, Grade>> = {};
  for (const subject of subjects) {
    const grade = value[subject.id];
    if (!isGrade(grade)) {
      return null;
    }
    subjectGrades[subject.id] = grade;
  }
  return subjectGrades as Record<SubjectId, Grade>;
}

function isGrade(value: unknown): value is Grade {
  return grades.some((grade) => grade === value);
}

function parseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length <= maximumTextLength ? trimmed : null;
}

function decodeJpegDataUrl(value: unknown): Buffer<ArrayBuffer> | null {
  if (
    typeof value !== 'string' ||
    value.length > maximumPhotoDataUrlLength ||
    !value.startsWith(jpegDataUrlPrefix)
  ) {
    return null;
  }
  const base64 = value.slice(jpegDataUrlPrefix.length);
  // Buffer.from silently skips invalid base64 characters, so the alphabet is checked first.
  if (base64.length % 4 !== 0 || !base64Pattern.test(base64)) {
    return null;
  }
  const bytes = Buffer.from(base64, 'base64');
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? bytes : null;
}
