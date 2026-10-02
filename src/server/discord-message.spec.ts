// @vitest-environment node
import { createDiscordMessage } from './discord-message';
import type { ValidatedReportCard } from './report-card-validation';

interface DiscordPayload {
  attachments: unknown[];
  embeds: { fields: { name: string }[]; image?: unknown }[];
}

const submittedAt = new Date('2026-10-02T22:30:00Z');
const photo = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

function createReportCard(overrides: Partial<ValidatedReportCard> = {}): ValidatedReportCard {
  return {
    grades: { taste: 1, portion: 2, presentation: 2 },
    wishes: 'Mehr Gemüse',
    message: 'Danke, Koch!',
    photo,
    ...overrides,
  };
}

function readPayload(message: FormData): DiscordPayload {
  return JSON.parse(String(message.get('payload_json')));
}

describe('createDiscordMessage', () => {
  it('builds an embed with the Berlin day, the overall grade, the subject grades, the texts and the photo', () => {
    const message = createDiscordMessage(createReportCard(), submittedAt);

    expect(readPayload(message)).toEqual({
      username: 'Lunchbox-Zeugnis',
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: 'Zeugnis vom Samstag, 3. Oktober',
          color: 0xd63a8c,
          timestamp: '2026-10-02T22:30:00.000Z',
          description: '**Gesamtnote 1,7 – gut**',
          fields: [
            { name: 'Geschmack', value: '1 – sehr gut', inline: true },
            { name: 'Portionsgröße', value: '2 – gut', inline: true },
            { name: 'Optik & Anrichtung', value: '2 – gut', inline: true },
            { name: 'Wunschzettel', value: 'Mehr Gemüse' },
            { name: 'Nachricht an den Koch', value: 'Danke, Koch!' },
          ],
          image: { url: 'attachment://essplatz.jpg' },
        },
      ],
      attachments: [{ id: 0, filename: 'essplatz.jpg', description: 'Essplatz heute' }],
    });
  });

  it('attaches the photo bytes as the JPEG file files[0]', async () => {
    const file = createDiscordMessage(createReportCard(), submittedAt).get('files[0]');

    expect(file).toBeInstanceOf(File);
    const photoFile = file as File;
    expect(photoFile.name).toBe('essplatz.jpg');
    expect(photoFile.type).toBe('image/jpeg');
    expect(Buffer.from(await photoFile.arrayBuffer())).toEqual(photo);
  });

  it('omits the file, the attachment entry and the embed image without a photo', () => {
    const message = createDiscordMessage(createReportCard({ photo: null }), submittedAt);

    const payload = readPayload(message);
    expect(message.has('files[0]')).toBe(false);
    expect(payload.attachments).toEqual([]);
    expect(payload.embeds[0]).not.toHaveProperty('image');
  });

  it.each([
    ['', '', []],
    ['Mehr Gemüse', '', ['Wunschzettel']],
    ['', 'Danke, Koch!', ['Nachricht an den Koch']],
  ])(
    'adds only the text fields that are not empty (wishes "%s", message "%s")',
    (wishes, message, expectedTextFields) => {
      const payload = readPayload(
        createDiscordMessage(createReportCard({ wishes, message }), submittedAt),
      );

      expect(payload.embeds[0].fields.map((field) => field.name)).toEqual([
        'Geschmack',
        'Portionsgröße',
        'Optik & Anrichtung',
        ...expectedTextFields,
      ]);
    },
  );
});
