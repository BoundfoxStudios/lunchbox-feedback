import { formatBerlinDay } from '../shared/berlin-day';
import { calculateAverage, describeAverage, formatAverage, gradeWords } from '../shared/grading';
import { subjects } from '../shared/report-card';
import type { ValidatedReportCard } from './report-card-validation';

const photoFilename = 'essplatz.jpg';

export function createDiscordMessage(reportCard: ValidatedReportCard, submittedAt: Date): FormData {
  const { grades, wishes, message, photo } = reportCard;
  const average = calculateAverage(subjects.map((subject) => grades[subject.id]))!;
  const embed = {
    title: `Zeugnis vom ${formatBerlinDay(submittedAt)}`,
    color: 0xd63a8c,
    timestamp: submittedAt.toISOString(),
    description: `**Gesamtnote ${formatAverage(average)} – ${describeAverage(average)}**`,
    fields: [
      ...subjects.map((subject) => {
        const grade = grades[subject.id];
        return { name: subject.label, value: `${grade} – ${gradeWords[grade]}`, inline: true };
      }),
      // Discord rejects empty field values.
      ...(wishes ? [{ name: 'Wunschzettel', value: wishes }] : []),
      ...(message ? [{ name: 'Nachricht an den Koch', value: message }] : []),
    ],
    ...(photo ? { image: { url: `attachment://${photoFilename}` } } : {}),
  };

  const formData = new FormData();
  formData.append(
    'payload_json',
    JSON.stringify({
      username: 'Lunchbox-Zeugnis',
      // An empty parse list suppresses every mention the free texts could contain.
      allowed_mentions: { parse: [] },
      embeds: [embed],
      attachments: photo ? [{ id: 0, filename: photoFilename, description: 'Essplatz heute' }] : [],
    }),
  );
  if (photo) {
    formData.append('files[0]', new Blob([photo], { type: 'image/jpeg' }), photoFilename);
  }
  return formData;
}
