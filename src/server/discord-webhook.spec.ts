// @vitest-environment node
import type { MockInstance } from 'vitest';
import { postToDiscord } from './discord-webhook';

describe('postToDiscord', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/123456/token_abc-XYZ');
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('posts the message to the configured webhook as API v10 URL with wait=true and the DiscordBot user agent', async () => {
    const message = new FormData();

    await postToDiscord(message);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, requestInit] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://discord.com/api/v10/webhooks/123456/token_abc-XYZ?wait=true');
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.body).toBe(message);
    const headers = new Headers(requestInit?.headers);
    expect(headers.get('User-Agent')).toBe(
      'DiscordBot (https://github.com/BoundfoxStudios/lunchbox-feedback, 1.0.0)',
    );
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('replaces the API version and the query of the configured URL with v10 and wait=true', async () => {
    vi.stubEnv(
      'DISCORD_WEBHOOK_URL',
      'https://ptb.discord.com/api/v9/webhooks/123456/token_abc-XYZ?wait=false',
    );

    await postToDiscord(new FormData());

    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://discord.com/api/v10/webhooks/123456/token_abc-XYZ?wait=true');
  });

  it('rejects without calling Discord when DISCORD_WEBHOOK_URL is not set', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', undefined);

    await expect(postToDiscord(new FormData())).rejects.toThrow('DISCORD_WEBHOOK_URL is not set');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects without calling Discord when DISCORD_WEBHOOK_URL is not a Discord webhook URL', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://example.com/hooks/abc');

    await expect(postToDiscord(new FormData())).rejects.toThrow(/not a Discord webhook URL/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects with the status and the response text when Discord answers with an error', async () => {
    fetchSpy.mockResolvedValue(new Response('{"message": "Invalid Form Body"}', { status: 400 }));

    await expect(postToDiscord(new FormData())).rejects.toThrow(/400.*Invalid Form Body/);
  });
});
