import type { Grade } from './grading';

export const subjects = [
  { id: 'taste', label: 'Geschmack', hint: 'Wie hat es geschmeckt?' },
  { id: 'portion', label: 'Portionsgröße', hint: 'Genau richtig satt?' },
  { id: 'presentation', label: 'Optik & Anrichtung', hint: 'Isst das Auge mit?' },
] as const;

export type SubjectId = (typeof subjects)[number]['id'];

export interface ReportCardSubmission {
  grades: Record<SubjectId, Grade>;
  wishes: string;
  message: string;
  photo: string | null;
}

export const reportCardEndpoint = '/api/report-cards';

// Stays below Discord's limit of 1024 characters per embed field value.
export const maximumTextLength = 1000;

// Keeps the JSON body below 1 MiB: the shared host's ModSecurity WAF may reject larger
// non-multipart bodies.
export const maximumPhotoDataUrlLength = 900_000;

export const jpegDataUrlPrefix = 'data:image/jpeg;base64,';
