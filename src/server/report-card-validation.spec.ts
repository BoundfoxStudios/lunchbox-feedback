// @vitest-environment node
import { jpegDataUrlPrefix, maximumPhotoDataUrlLength } from '../shared/report-card';
import { parseReportCardSubmission } from './report-card-validation';

function createJpegDataUrl(byteLength: number): string {
  const bytes = Buffer.alloc(byteLength);
  bytes.set([0xff, 0xd8, 0xff]);
  return jpegDataUrlPrefix + bytes.toString('base64');
}

function createBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    grades: { taste: 1, portion: 2, presentation: 6 },
    wishes: '  Mehr Gemüse  ',
    message: '\nDanke, Koch!\t',
    photo: createJpegDataUrl(6),
    ...overrides,
  };
}

describe('parseReportCardSubmission', () => {
  it('returns the grades, the trimmed texts and the decoded photo bytes for a valid body', () => {
    expect(parseReportCardSubmission(createBody())).toEqual({
      grades: { taste: 1, portion: 2, presentation: 6 },
      wishes: 'Mehr Gemüse',
      message: 'Danke, Koch!',
      photo: Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00]),
    });
  });

  it('accepts a body without a photo', () => {
    expect(parseReportCardSubmission(createBody({ photo: null }))?.photo).toBeNull();
  });

  it.each([
    ['exactly 1000 characters', 'a'.repeat(1000)],
    ['1000 characters surrounded by whitespace', ` ${'a'.repeat(1000)} `],
  ])('accepts a text of %s', (_scenario, text) => {
    expect(parseReportCardSubmission(createBody({ wishes: text, message: text }))).not.toBeNull();
  });

  it.each<[string, unknown]>([
    ['a null body', null],
    ['an undefined body', undefined],
    ['an array body', [createBody()]],
    ['a string body', 'Zeugnis'],
    ['missing grades', createBody({ grades: undefined })],
    ['null grades', createBody({ grades: null })],
    ['a grade of 0', createBody({ grades: { taste: 0, portion: 2, presentation: 3 } })],
    ['a grade of 7', createBody({ grades: { taste: 1, portion: 7, presentation: 3 } })],
    ['a fractional grade', createBody({ grades: { taste: 1, portion: 2, presentation: 2.5 } })],
    ['a grade as a string', createBody({ grades: { taste: '1', portion: 2, presentation: 3 } })],
    ['a missing grade', createBody({ grades: { taste: 1, portion: 2 } })],
    ['wishes that are not a string', createBody({ wishes: 42 })],
    ['a missing message', createBody({ message: undefined })],
    ['wishes of 1001 characters', createBody({ wishes: 'a'.repeat(1001) })],
    ['a message of 1001 characters', createBody({ message: 'a'.repeat(1001) })],
    ['a missing photo', createBody({ photo: undefined })],
    ['a photo that is not a string', createBody({ photo: 42 })],
    [
      'a photo with another media type',
      createBody({ photo: createJpegDataUrl(6).replace('image/jpeg', 'image/png') }),
    ],
    [
      'a photo with invalid base64 characters',
      createBody({ photo: `${jpegDataUrlPrefix}/9j/4A!A` }),
    ],
    [
      'a photo with a truncated base64 payload',
      createBody({ photo: `${jpegDataUrlPrefix}/9j/4AA` }),
    ],
    [
      'a photo without the JPEG signature',
      createBody({
        photo: jpegDataUrlPrefix + Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64'),
      }),
    ],
    [
      'a photo longer than the maximum data URL length',
      createBody({ photo: createJpegDataUrl((maximumPhotoDataUrlLength * 3) / 4) }),
    ],
  ])('rejects %s', (_scenario, body) => {
    expect(parseReportCardSubmission(body)).toBeNull();
  });
});
