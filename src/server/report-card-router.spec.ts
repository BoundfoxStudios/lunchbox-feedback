// @vitest-environment node
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Mock } from 'vitest';
import { jpegDataUrlPrefix, reportCardEndpoint } from '../shared/report-card';
import { createReportCardRouter } from './report-card-router';

const submittedAt = new Date('2026-10-02T22:30:00Z');
const validBody = {
  grades: { taste: 1, portion: 2, presentation: 2 },
  wishes: 'Mehr Gemüse',
  message: 'Danke, Koch!',
  photo: jpegDataUrlPrefix + Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64'),
};

describe('createReportCardRouter', () => {
  let server: Server;
  let baseUrl: string;
  let deliver: Mock<(message: FormData) => Promise<void>>;

  beforeEach(async () => {
    deliver = vi.fn<(message: FormData) => Promise<void>>().mockResolvedValue(undefined);
    const app = express();
    app.use(createReportCardRouter({ deliver, now: () => submittedAt }));
    server = await new Promise<Server>((resolve) => {
      const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise((resolve) => server.close(resolve));
  });

  function postReportCard(body: string): Promise<Response> {
    return fetch(baseUrl + reportCardEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  it('delivers a valid report card stamped with the injected time and answers 204', async () => {
    const response = await postReportCard(JSON.stringify(validBody));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(deliver).toHaveBeenCalledOnce();
    const message = deliver.mock.calls[0][0];
    expect(JSON.parse(String(message.get('payload_json')))).toMatchObject({
      embeds: [{ title: 'Zeugnis vom Samstag, 3. Oktober' }],
    });
  });

  it('answers 400 for an invalid report card without delivering it', async () => {
    const response = await postReportCard(
      JSON.stringify({ ...validBody, grades: { taste: 0, portion: 2, presentation: 2 } }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid-report-card' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('logs the failure and answers 502 when the delivery fails', async () => {
    const deliveryError = new Error('Discord is down');
    deliver.mockRejectedValue(deliveryError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await postReportCard(JSON.stringify(validBody));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'delivery-failed' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Discord delivery failed', deliveryError);
  });

  it('answers 413 for a body larger than 1 MB', async () => {
    const response = await postReportCard(
      JSON.stringify({ ...validBody, message: 'a'.repeat(1_100_000) }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'invalid-request' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('answers 400 for malformed JSON', async () => {
    const response = await postReportCard('{"grades": ');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid-request' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown API path', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not-found' });
  });
});
